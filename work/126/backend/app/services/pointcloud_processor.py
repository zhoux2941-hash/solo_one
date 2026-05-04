import open3d as o3d
import numpy as np
from pathlib import Path
from typing import Optional, List, Tuple, Dict
import laspy
from ..models.schemas import Point3D, Vector3D

class PointCloudProcessor:
    def __init__(self):
        pass
    
    def load_point_cloud(self, file_path: str) -> Tuple[o3d.geometry.PointCloud, Dict]:
        """加载点云文件，支持 .las, .ply 格式"""
        file_path = Path(file_path)
        file_type = file_path.suffix.lower()
        
        if file_type == '.las':
            return self._load_las_file(file_path)
        elif file_type == '.ply':
            return self._load_ply_file(file_path)
        else:
            raise ValueError(f"不支持的文件格式: {file_type}")
    
    def _load_las_file(self, file_path: Path) -> Tuple[o3d.geometry.PointCloud, Dict]:
        """加载 .las 格式点云文件"""
        las = laspy.read(str(file_path))
        
        x = las.x
        y = las.y
        z = las.z
        
        points = np.column_stack((x, y, z)).astype(np.float64)
        
        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(points)
        
        if hasattr(las, 'red') and hasattr(las, 'green') and hasattr(las, 'blue'):
            colors = np.column_stack((las.red, las.green, las.blue)).astype(np.float64) / 65535.0
            pcd.colors = o3d.utility.Vector3dVector(colors)
        
        info = {
            'point_count': len(points),
            'bounds_min': {
                'x': float(np.min(points[:, 0])),
                'y': float(np.min(points[:, 1])),
                'z': float(np.min(points[:, 2]))
            },
            'bounds_max': {
                'x': float(np.max(points[:, 0])),
                'y': float(np.max(points[:, 1])),
                'z': float(np.max(points[:, 2]))
            }
        }
        
        return pcd, info
    
    def _load_ply_file(self, file_path: Path) -> Tuple[o3d.geometry.PointCloud, Dict]:
        """加载 .ply 格式点云文件"""
        pcd = o3d.io.read_point_cloud(str(file_path))
        
        if pcd.is_empty():
            raise ValueError("无法加载点云文件，文件可能为空或格式不正确")
        
        points = np.asarray(pcd.points)
        
        info = {
            'point_count': len(points),
            'bounds_min': {
                'x': float(np.min(points[:, 0])),
                'y': float(np.min(points[:, 1])),
                'z': float(np.min(points[:, 2]))
            },
            'bounds_max': {
                'x': float(np.max(points[:, 0])),
                'y': float(np.max(points[:, 1])),
                'z': float(np.max(points[:, 2]))
            }
        }
        
        return pcd, info
    
    def compute_normals(self, pcd: o3d.geometry.PointCloud, 
                        radius: float = 0.05, 
                        max_nn: int = 30) -> o3d.geometry.PointCloud:
        """计算点云法线"""
        pcd.estimate_normals(
            search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=radius, max_nn=max_nn)
        )
        pcd.orient_normals_consistent_tangent_plane(k=50)
        return pcd
    
    def detect_normal_changes(self, pcd: o3d.geometry.PointCloud,
                               threshold: float = 0.5,
                               neighborhood_radius: float = 0.1) -> List[Dict]:
        """
        通过法线突变检测弹孔特征
        弹孔边缘通常会有明显的法线方向变化
        """
        if not pcd.has_normals():
            pcd = self.compute_normals(pcd)
        
        points = np.asarray(pcd.points)
        normals = np.asarray(pcd.normals)
        
        kdtree = o3d.geometry.KDTreeFlann(pcd)
        
        candidate_points = []
        
        for i in range(len(points)):
            [k, idx, _] = kdtree.search_radius_vector_3d(
                pcd.points[i], neighborhood_radius
            )
            
            if k < 5:
                continue
            
            neighbor_normals = normals[idx]
            
            normal_variances = np.var(neighbor_normals, axis=0)
            total_variance = np.sum(normal_variances)
            
            mean_normal = np.mean(neighbor_normals, axis=0)
            mean_normal = mean_normal / (np.linalg.norm(mean_normal) + 1e-8)
            
            angle_diffs = np.arccos(np.clip(
                np.dot(neighbor_normals, mean_normal), -1.0, 1.0
            ))
            max_angle_diff = np.max(angle_diffs)
            
            if total_variance > threshold and max_angle_diff > np.pi / 6:
                candidate_points.append({
                    'position': Point3D(
                        x=float(points[i, 0]),
                        y=float(points[i, 1]),
                        z=float(points[i, 2])
                    ),
                    'normal': Vector3D(
                        x=float(mean_normal[0]),
                        y=float(mean_normal[1]),
                        z=float(mean_normal[2])
                    ),
                    'variance': float(total_variance),
                    'max_angle_diff': float(max_angle_diff),
                    'confidence': min(1.0, total_variance / (threshold * 2))
                })
        
        candidate_points.sort(key=lambda x: x['confidence'], reverse=True)
        
        return candidate_points[:50]
    
    def segment_hole_region(self, pcd: o3d.geometry.PointCloud,
                            center_point: np.ndarray,
                            radius: float = 0.05) -> Dict:
        """
        对检测到的弹孔区域进行分割，判断是射入口还是射出口
        - 射入口通常边缘整齐，呈圆形
        - 射出口通常边缘不规则，有崩裂痕迹
        """
        kdtree = o3d.geometry.KDTreeFlann(pcd)
        
        [k, idx, _] = kdtree.search_radius_vector_3d(center_point, radius)
        
        if k < 10:
            return {'hole_type': 'unknown', 'confidence': 0.0}
        
        neighborhood = pcd.select_by_index(idx)
        
        points = np.asarray(neighborhood.points)
        
        centroid = np.mean(points, axis=0)
        centered = points - centroid
        
        distances = np.linalg.norm(centered, axis=1)
        radius_variance = np.var(distances)
        mean_radius = np.mean(distances)
        
        circularity = 1.0 - (radius_variance / (mean_radius ** 2 + 1e-8))
        circularity = max(0.0, min(1.0, circularity))
        
        if neighborhood.has_normals():
            normals = np.asarray(neighborhood.normals)
            mean_normal = np.mean(normals, axis=0)
            mean_normal = mean_normal / (np.linalg.norm(mean_normal) + 1e-8)
            
            normal_consistency = np.mean(np.dot(normals, mean_normal))
        else:
            normal_consistency = 0.5
        
        if circularity > 0.7 and normal_consistency > 0.8:
            hole_type = 'entrance'
            confidence = (circularity + normal_consistency) / 2
        elif circularity < 0.5 and normal_consistency < 0.6:
            hole_type = 'exit'
            confidence = 1.0 - (circularity + normal_consistency) / 2
        else:
            hole_type = 'uncertain'
            confidence = 0.5
        
        return {
            'hole_type': hole_type,
            'confidence': float(confidence),
            'circularity': float(circularity),
            'normal_consistency': float(normal_consistency)
        }
    
    def downsample_point_cloud(self, pcd: o3d.geometry.PointCloud,
                                voxel_size: float = 0.01) -> o3d.geometry.PointCloud:
        """对点云进行下采样以提高处理速度"""
        return pcd.voxel_down_sample(voxel_size=voxel_size)
    
    def export_for_visualization(self, pcd: o3d.geometry.PointCloud,
                                  output_path: str,
                                  format: str = 'ply') -> str:
        """导出点云用于前端可视化"""
        output_path = Path(output_path)
        
        if format.lower() == 'ply':
            o3d.io.write_point_cloud(str(output_path), pcd)
        else:
            raise ValueError(f"不支持的导出格式: {format}")
        
        return str(output_path)
