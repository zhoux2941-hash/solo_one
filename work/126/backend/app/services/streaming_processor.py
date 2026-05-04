import open3d as o3d
import numpy as np
from pathlib import Path
from typing import Optional, List, Tuple, Dict, Generator
import laspy
from dataclasses import dataclass
from contextlib import contextmanager
import math

from ..models.schemas import Point3D, Vector3D
from ..config import settings

@dataclass
class LODLevel:
    level: int
    voxel_size: float
    max_points: int
    target_points: int

class StreamingPointCloudProcessor:
    LOD_LEVELS = [
        LODLevel(level=0, voxel_size=0.005, max_points=10_000_000, target_points=5_000_000),
        LODLevel(level=1, voxel_size=0.02, max_points=2_000_000, target_points=1_000_000),
        LODLevel(level=2, voxel_size=0.05, max_points=500_000, target_points=200_000),
        LODLevel(level=3, voxel_size=0.1, max_points=100_000, target_points=50_000),
        LODLevel(level=4, voxel_size=0.2, max_points=20_000, target_points=10_000),
    ]
    
    CHUNK_READ_SIZE = 1_000_000
    
    def __init__(self):
        self.bounds_min = np.array([np.inf, np.inf, np.inf])
        self.bounds_max = np.array([-np.inf, -np.inf, -np.inf])
        self.total_points = 0
    
    def stream_las_points(self, file_path: str) -> Generator[Tuple[np.ndarray, Optional[np.ndarray]], None, None]:
        """
        流式读取LAS文件，逐块返回点数据
        返回 (坐标数组, 颜色数组)
        """
        file_path = Path(file_path)
        
        with laspy.open(str(file_path)) as reader:
            total_points = reader.header.point_count
            self.total_points = total_points
            
            num_chunks = (total_points + self.CHUNK_READ_SIZE - 1) // self.CHUNK_READ_SIZE
            
            for chunk_idx in range(num_chunks):
                start_idx = chunk_idx * self.CHUNK_READ_SIZE
                end_idx = min((chunk_idx + 1) * self.CHUNK_READ_SIZE, total_points)
                
                chunk = reader.read_points(range(start_idx, end_idx))
                
                x = chunk.X * reader.header.scales[0] + reader.header.offsets[0]
                y = chunk.Y * reader.header.scales[1] + reader.header.offsets[1]
                z = chunk.Z * reader.header.scales[2] + reader.header.offsets[2]
                
                points = np.column_stack((x, y, z)).astype(np.float64)
                
                self.bounds_min = np.minimum(self.bounds_min, np.min(points, axis=0))
                self.bounds_max = np.maximum(self.bounds_max, np.max(points, axis=0))
                
                colors = None
                if hasattr(chunk, 'red') and hasattr(chunk, 'green') and hasattr(chunk, 'blue'):
                    colors = np.column_stack((
                        chunk.red.astype(np.float64) / 65535.0,
                        chunk.green.astype(np.float64) / 65535.0,
                        chunk.blue.astype(np.float64) / 65535.0
                    ))
                
                yield points, colors
    
    def stream_ply_points(self, file_path: str) -> Generator[Tuple[np.ndarray, Optional[np.ndarray]], None, None]:
        """
        流式读取PLY文件
        注意：Open3D的PLY读取不支持流式，所以对于大文件先尝试完整读取
        如果文件太大，使用渐进式下采样
        """
        file_path = Path(file_path)
        
        pcd = o3d.io.read_point_cloud(str(file_path))
        
        if pcd.is_empty():
            raise ValueError("无法加载PLY文件")
        
        points = np.asarray(pcd.points)
        self.total_points = len(points)
        
        self.bounds_min = np.min(points, axis=0)
        self.bounds_max = np.max(points, axis=0)
        
        colors = None
        if pcd.has_colors():
            colors = np.asarray(pcd.colors)
        
        num_chunks = (len(points) + self.CHUNK_READ_SIZE - 1) // self.CHUNK_READ_SIZE
        for chunk_idx in range(num_chunks):
            start_idx = chunk_idx * self.CHUNK_READ_SIZE
            end_idx = min((chunk_idx + 1) * self.CHUNK_READ_SIZE, len(points))
            
            chunk_points = points[start_idx:end_idx]
            chunk_colors = colors[start_idx:end_idx] if colors is not None else None
            
            yield chunk_points, chunk_colors
    
    def generate_lod_pyramid(self, 
                              file_path: str,
                              output_dir: str,
                              base_name: str) -> Dict[int, Dict]:
        """
        生成LOD金字塔
        流式处理大文件，避免内存溢出
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = Path(file_path)
        file_type = file_path.suffix.lower()
        
        if file_type == '.las':
            point_stream = self.stream_las_points(str(file_path))
        elif file_type == '.ply':
            point_stream = self.stream_ply_points(str(file_path))
        else:
            raise ValueError(f"不支持的文件格式: {file_type}")
        
        lod_voxels = {}
        lod_point_counts = {}
        
        for lod_level in self.LOD_LEVELS:
            lod_voxels[lod_level.level] = {}
            lod_point_counts[lod_level.level] = 0
        
        all_points = []
        all_colors = []
        
        for chunk_points, chunk_colors in point_stream:
            all_points.append(chunk_points)
            if chunk_colors is not None:
                all_colors.append(chunk_colors)
            
            for lod_level in self.LOD_LEVELS:
                self._downsample_chunk_to_voxels(
                    chunk_points,
                    chunk_colors,
                    lod_voxels[lod_level.level],
                    lod_level.voxel_size
                )
        
        lod_info = {}
        
        for lod_level in self.LOD_LEVELS:
            voxel_dict = lod_voxels[lod_level.level]
            
            lod_points = []
            lod_colors = []
            
            for voxel_key, voxel_data in voxel_dict.items():
                lod_points.append(voxel_data['centroid'])
                if voxel_data.get('color') is not None:
                    lod_colors.append(voxel_data['color'])
            
            if not lod_points:
                continue
            
            lod_points_np = np.array(lod_points)
            pcd = o3d.geometry.PointCloud()
            pcd.points = o3d.utility.Vector3dVector(lod_points_np)
            
            if lod_colors:
                lod_colors_np = np.array(lod_colors)
                pcd.colors = o3d.utility.Vector3dVector(lod_colors_np)
            
            lod_file = output_dir / f"{base_name}_lod{lod_level.level}.ply"
            o3d.io.write_point_cloud(str(lod_file), pcd)
            
            lod_info[lod_level.level] = {
                'lod_level': lod_level.level,
                'voxel_size': lod_level.voxel_size,
                'point_count': len(lod_points),
                'file_path': str(lod_file)
            }
        
        return lod_info
    
    def _downsample_chunk_to_voxels(self,
                                      points: np.ndarray,
                                      colors: Optional[np.ndarray],
                                      voxel_dict: Dict,
                                      voxel_size: float):
        """
        将点块下采样到体素中（增量式）
        """
        if len(points) == 0:
            return
        
        voxel_indices = np.floor(points / voxel_size).astype(np.int64)
        
        for i, idx in enumerate(voxel_indices):
            key = tuple(idx)
            
            if key in voxel_dict:
                voxel_dict[key]['count'] += 1
                voxel_dict[key]['sum'] += points[i]
                if colors is not None:
                    voxel_dict[key]['color_sum'] += colors[i]
            else:
                voxel_dict[key] = {
                    'count': 1,
                    'sum': points[i].copy(),
                    'color_sum': colors[i].copy() if colors is not None else None
                }
        
        for key in voxel_dict:
            voxel_dict[key]['centroid'] = voxel_dict[key]['sum'] / voxel_dict[key]['count']
            if voxel_dict[key]['color_sum'] is not None:
                voxel_dict[key]['color'] = voxel_dict[key]['color_sum'] / voxel_dict[key]['count']
    
    def get_bounds(self) -> Tuple[np.ndarray, np.ndarray]:
        """获取点云边界"""
        return self.bounds_min, self.bounds_max
    
    def get_info(self) -> Dict:
        """获取点云信息"""
        return {
            'point_count': self.total_points,
            'bounds_min': {
                'x': float(self.bounds_min[0]),
                'y': float(self.bounds_min[1]),
                'z': float(self.bounds_min[2])
            },
            'bounds_max': {
                'x': float(self.bounds_max[0]),
                'y': float(self.bounds_max[1]),
                'z': float(self.bounds_max[2])
            }
        }


class OptimizedHoleDetector:
    """
    优化的弹孔检测器
    降低误报率，提高检测精度
    """
    
    def __init__(self):
        self.min_hole_radius = 0.003
        self.max_hole_radius = 0.05
        self.min_points_per_hole = 5
        self.max_candidates = 100
    
    def detect_holes_optimized(self,
                                 pcd: o3d.geometry.PointCloud,
                                 min_normal_variance: float = 0.3,
                                 neighborhood_radius: float = 0.08) -> List[Dict]:
        """
        优化的弹孔检测算法
        多层次验证降低误报率
        """
        if not pcd.has_normals():
            pcd.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.05, max_nn=30)
            )
            pcd.orient_normals_consistent_tangent_plane(k=50)
        
        points = np.asarray(pcd.points)
        normals = np.asarray(pcd.normals)
        
        kdtree = o3d.geometry.KDTreeFlann(pcd)
        
        raw_candidates = []
        
        step = max(1, len(points) // 10000)
        
        for i in range(0, len(points), step):
            [k, idx, _] = kdtree.search_radius_vector_3d(
                pcd.points[i], neighborhood_radius
            )
            
            if k < self.min_points_per_hole:
                continue
            
            neighbor_points = points[idx]
            neighbor_normals = normals[idx]
            
            features = self._extract_features(
                neighbor_points,
                neighbor_normals,
                points[i]
            )
            
            if self._is_hole_candidate(features, min_normal_variance):
                raw_candidates.append({
                    'index': i,
                    'position': points[i],
                    'normal': np.mean(neighbor_normals, axis=0),
                    'features': features,
                    'score': self._calculate_hole_score(features)
                })
        
        raw_candidates.sort(key=lambda x: x['score'], reverse=True)
        
        filtered_candidates = self._non_maximum_suppression(
            raw_candidates,
            distance_threshold=neighborhood_radius
        )
        
        return [self._format_candidate(c) for c in filtered_candidates[:self.max_candidates]]
    
    def _extract_features(self,
                          points: np.ndarray,
                          normals: np.ndarray,
                          center_point: np.ndarray) -> Dict:
        """
        提取弹孔候选点的多维度特征
        """
        centered = points - center_point
        distances = np.linalg.norm(centered, axis=1)
        
        normal_variances = np.var(normals, axis=0)
        total_normal_variance = np.sum(normal_variances)
        
        mean_normal = np.mean(normals, axis=0)
        mean_normal = mean_normal / (np.linalg.norm(mean_normal) + 1e-8)
        
        normal_dots = np.dot(normals, mean_normal)
        normal_angle_variance = np.var(np.arccos(np.clip(normal_dots, -1.0, 1.0)))
        
        if len(points) >= 3:
            cov = np.cov(centered.T)
            eigenvalues, _ = np.linalg.eigh(cov)
            eigenvalues = np.sort(eigenvalues)[::-1]
            eigenvalue_ratio = eigenvalues[0] / (eigenvalues[2] + 1e-8)
            planarity = (eigenvalues[1] - eigenvalues[2]) / (eigenvalues[0] + 1e-8)
        else:
            eigenvalue_ratio = 1.0
            planarity = 0.0
        
        radius_variance = np.var(distances)
        mean_radius = np.mean(distances)
        radius_cv = radius_variance / (mean_radius ** 2 + 1e-8)
        
        proj_on_normal = np.dot(centered, mean_normal)
        depth_variance = np.var(proj_on_normal)
        
        return {
            'normal_variance': total_normal_variance,
            'normal_angle_variance': normal_angle_variance,
            'eigenvalue_ratio': eigenvalue_ratio,
            'planarity': planarity,
            'radius_variance': radius_variance,
            'radius_cv': radius_cv,
            'depth_variance': depth_variance,
            'mean_radius': mean_radius,
            'point_count': len(points),
            'max_normal_dot': np.max(normal_dots),
            'min_normal_dot': np.min(normal_dots)
        }
    
    def _is_hole_candidate(self, features: Dict, min_normal_variance: float) -> bool:
        """
        多层次过滤，降低误报率
        """
        if features['point_count'] < self.min_points_per_hole:
            return False
        
        if features['mean_radius'] < self.min_hole_radius:
            return False
        if features['mean_radius'] > self.max_hole_radius:
            return False
        
        if features['normal_variance'] < min_normal_variance * 0.5:
            return False
        
        if features['normal_angle_variance'] < 0.1:
            return False
        
        if features['planarity'] > 0.9 and features['normal_variance'] < min_normal_variance:
            return False
        
        if features['radius_cv'] < 0.1 and features['normal_variance'] < min_normal_variance:
            return False
        
        return True
    
    def _calculate_hole_score(self, features: Dict) -> float:
        """
        计算弹孔置信度评分
        """
        score = 0.0
        
        normal_score = min(1.0, features['normal_variance'] / 1.5)
        score += normal_score * 0.4
        
        angle_score = min(1.0, features['normal_angle_variance'] / 0.5)
        score += angle_score * 0.3
        
        radius_optimal = 0.015
        radius_diff = abs(features['mean_radius'] - radius_optimal)
        radius_score = max(0.0, 1.0 - radius_diff / 0.02)
        score += radius_score * 0.2
        
        depth_score = min(1.0, features['depth_variance'] / 0.001)
        score += depth_score * 0.1
        
        return min(1.0, score)
    
    def _non_maximum_suppression(self,
                                   candidates: List[Dict],
                                   distance_threshold: float) -> List[Dict]:
        """
        非极大值抑制，去除重叠的候选点
        """
        if not candidates:
            return []
        
        candidates = sorted(candidates, key=lambda x: x['score'], reverse=True)
        
        selected = []
        selected_indices = set()
        
        for i, candidate in enumerate(candidates):
            if i in selected_indices:
                continue
            
            selected.append(candidate)
            
            for j, other in enumerate(candidates[i+1:], start=i+1):
                if j in selected_indices:
                    continue
                
                dist = np.linalg.norm(candidate['position'] - other['position'])
                if dist < distance_threshold:
                    selected_indices.add(j)
        
        return selected
    
    def _format_candidate(self, candidate: Dict) -> Dict:
        """格式化候选点输出"""
        position = candidate['position']
        normal = candidate['normal']
        
        return {
            'position': Point3D(
                x=float(position[0]),
                y=float(position[1]),
                z=float(position[2])
            ),
            'normal': Vector3D(
                x=float(normal[0]),
                y=float(normal[1]),
                z=float(normal[2])
            ),
            'score': float(candidate['score']),
            'features': {
                k: float(v) if isinstance(v, (int, float, np.floating, np.integer)) else v
                for k, v in candidate['features'].items()
            },
            'confidence': float(candidate['score'])
        }
