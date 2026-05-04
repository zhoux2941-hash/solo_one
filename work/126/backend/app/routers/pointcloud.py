from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Form
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pathlib import Path
import uuid
from typing import List, Optional
import shutil
import aiofiles
import base64
import binascii

from ..database import get_session
from ..config import settings
from ..models.database import PointCloudData, ChunkedUpload, PointCloudLOD
from ..models.schemas import PointCloudUploadResponse, Point3D, Vector3D
from ..services.pointcloud_processor import PointCloudProcessor
from ..services.streaming_processor import StreamingPointCloudProcessor, OptimizedHoleDetector
from ..services.chunked_uploader import ChunkedUploader

router = APIRouter(prefix="/api/pointcloud", tags=["点云处理"])
processor = PointCloudProcessor()
streaming_processor = StreamingPointCloudProcessor()
optimized_detector = OptimizedHoleDetector()
chunked_uploader = ChunkedUploader()

@router.post("/upload", response_model=PointCloudUploadResponse)
async def upload_point_cloud(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session)
):
    """上传点云文件 (.las 或 .ply) - 适用于小文件"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式。支持格式: {settings.ALLOWED_EXTENSIONS}"
        )
    
    file_id = str(uuid.uuid4())
    save_filename = f"{file_id}{file_ext}"
    save_path = settings.UPLOAD_DIR / save_filename
    
    async with aiofiles.open(str(save_path), 'wb') as buffer:
        while content := await file.read(1024 * 1024):
            await buffer.write(content)
    
    try:
        streaming_proc = StreamingPointCloudProcessor()
        
        if file_ext == '.las':
            point_stream = streaming_proc.stream_las_points(str(save_path))
        else:
            point_stream = streaming_proc.stream_ply_points(str(save_path))
        
        for _ in point_stream:
            pass
        
        info = streaming_proc.get_info()
        
        lod_dir = settings.UPLOAD_DIR / "lod" / file_id
        lod_info = streaming_proc.generate_lod_pyramid(
            str(save_path),
            str(lod_dir),
            file_id
        )
        
        for lod_level, lod_data in lod_info.items():
            db_lod = PointCloudLOD(
                point_cloud_id=None,
                lod_level=lod_level,
                file_path=lod_data['file_path'],
                point_count=lod_data['point_count'],
                voxel_size=lod_data['voxel_size']
            )
            session.add(db_lod)
        
        db_pointcloud = PointCloudData(
            file_name=file.filename,
            file_path=str(save_path),
            file_type=file_ext.lstrip('.'),
            point_count=info['point_count'],
            bounds_min=info['bounds_min'],
            bounds_max=info['bounds_max'],
            processed=True
        )
        
        session.add(db_pointcloud)
        await session.commit()
        await session.refresh(db_pointcloud)
        
        for lod_level, lod_data in lod_info.items():
            result = await session.execute(
                select(PointCloudLOD).where(PointCloudLOD.file_path == lod_data['file_path'])
            )
            db_lod = result.scalar_one_or_none()
            if db_lod:
                db_lod.point_cloud_id = db_pointcloud.id
        
        await session.commit()
        
        return PointCloudUploadResponse(
            id=db_pointcloud.id,
            file_name=db_pointcloud.file_name,
            file_type=db_pointcloud.file_type,
            upload_time=db_pointcloud.upload_time,
            point_count=db_pointcloud.point_count,
            bounds_min=Point3D(**db_pointcloud.bounds_min) if db_pointcloud.bounds_min else None,
            bounds_max=Point3D(**db_pointcloud.bounds_max) if db_pointcloud.bounds_max else None
        )
        
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=500, detail=f"点云文件处理失败: {str(e)}")

@router.post("/chunked/init")
async def init_chunked_upload(
    file_name: str = Form(...),
    file_size: int = Form(...),
    chunk_size: Optional[int] = Form(None),
    session: AsyncSession = Depends(get_session)
):
    """
    初始化分片上传
    适用于大文件 (>500MB)
    """
    try:
        result = await chunked_uploader.init_upload(
            session=session,
            file_name=file_name,
            file_size=file_size,
            chunk_size=chunk_size
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/chunked/upload")
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk_data: str = Form(...),
    chunk_hash: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_session)
):
    """
    上传单个分片
    chunk_data 是 base64 编码的二进制数据
    """
    try:
        chunk_bytes = base64.b64decode(chunk_data)
    except binascii.Error:
        raise HTTPException(status_code=400, detail="无效的base64编码")
    
    try:
        result = await chunked_uploader.upload_chunk(
            session=session,
            upload_id=upload_id,
            chunk_index=chunk_index,
            chunk_data=chunk_bytes,
            chunk_hash=chunk_hash
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/chunked/status/{upload_id}")
async def get_chunked_upload_status(
    upload_id: str,
    session: AsyncSession = Depends(get_session)
):
    """获取分片上传状态"""
    try:
        status = await chunked_uploader.get_upload_status(session, upload_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/chunked/complete/{upload_id}")
async def complete_chunked_upload(
    upload_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    完成分片上传，合并分片并处理点云
    """
    try:
        status = await chunked_uploader.get_upload_status(session, upload_id)
        
        if status['status'] != 'uploading' and status['uploaded_chunks'] != status['total_chunks']:
            raise HTTPException(status_code=400, detail="上传未完成")
        
        merged_file_path = await chunked_uploader.merge_chunks(session, upload_id)
        
        streaming_proc = StreamingPointCloudProcessor()
        file_ext = Path(merged_file_path).suffix.lower().lstrip('.')
        
        if file_ext == 'las':
            point_stream = streaming_proc.stream_las_points(merged_file_path)
        else:
            point_stream = streaming_proc.stream_ply_points(merged_file_path)
        
        for _ in point_stream:
            pass
        
        info = streaming_proc.get_info()
        
        file_id = str(uuid.uuid4())
        final_path = settings.UPLOAD_DIR / f"{file_id}.{file_ext}"
        Path(merged_file_path).rename(final_path)
        
        result = await session.execute(
            select(ChunkedUpload).where(ChunkedUpload.upload_id == upload_id)
        )
        chunked_upload = result.scalar_one_or_none()
        
        db_pointcloud = PointCloudData(
            file_name=chunked_upload.file_name if chunked_upload else f"pointcloud_{file_id}",
            file_path=str(final_path),
            file_type=file_ext,
            point_count=info['point_count'],
            bounds_min=info['bounds_min'],
            bounds_max=info['bounds_max'],
            processed=True
        )
        
        session.add(db_pointcloud)
        await session.commit()
        await session.refresh(db_pointcloud)
        
        return {
            "message": "上传完成",
            "pointcloud_id": db_pointcloud.id,
            "point_count": db_pointcloud.point_count
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/chunked/cancel/{upload_id}")
async def cancel_chunked_upload(
    upload_id: str,
    session: AsyncSession = Depends(get_session)
):
    """取消分片上传"""
    try:
        await chunked_uploader.cancel_upload(session, upload_id)
        return {"message": "上传已取消", "upload_id": upload_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{pointcloud_id}", response_model=PointCloudUploadResponse)
async def get_point_cloud_info(
    pointcloud_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取点云文件信息"""
    result = await session.execute(
        select(PointCloudData).where(PointCloudData.id == pointcloud_id)
    )
    pointcloud = result.scalar_one_or_none()
    
    if not pointcloud:
        raise HTTPException(status_code=404, detail="点云数据不存在")
    
    return PointCloudUploadResponse(
        id=pointcloud.id,
        file_name=pointcloud.file_name,
        file_type=pointcloud.file_type,
        upload_time=pointcloud.upload_time,
        point_count=pointcloud.point_count,
        bounds_min=Point3D(**pointcloud.bounds_min) if pointcloud.bounds_min else None,
        bounds_max=Point3D(**pointcloud.bounds_max) if pointcloud.bounds_max else None
    )

@router.get("/{pointcloud_id}/lod")
async def get_point_cloud_lods(
    pointcloud_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取点云的LOD层级信息"""
    result = await session.execute(
        select(PointCloudLOD).where(PointCloudLOD.point_cloud_id == pointcloud_id)
    )
    lods = result.scalars().all()
    
    return {
        "pointcloud_id": pointcloud_id,
        "lod_levels": [
            {
                "lod_level": lod.lod_level,
                "point_count": lod.point_count,
                "voxel_size": lod.voxel_size
            }
            for lod in lods
        ]
    }

@router.get("/{pointcloud_id}/lod/{lod_level}")
async def download_lod_point_cloud(
    pointcloud_id: int,
    lod_level: int,
    session: AsyncSession = Depends(get_session)
):
    """下载指定LOD层级的点云"""
    result = await session.execute(
        select(PointCloudLOD).where(
            PointCloudLOD.point_cloud_id == pointcloud_id,
            PointCloudLOD.lod_level == lod_level
        )
    )
    lod = result.scalar_one_or_none()
    
    if not lod:
        raise HTTPException(status_code=404, detail="LOD层级不存在")
    
    file_path = Path(lod.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="LOD文件已被删除")
    
    return FileResponse(
        path=str(file_path),
        filename=f"lod{lod_level}_pointcloud.ply",
        media_type="application/octet-stream"
    )

@router.get("/{pointcloud_id}/download")
async def download_point_cloud(
    pointcloud_id: int,
    session: AsyncSession = Depends(get_session)
):
    """下载原始点云文件"""
    result = await session.execute(
        select(PointCloudData).where(PointCloudData.id == pointcloud_id)
    )
    pointcloud = result.scalar_one_or_none()
    
    if not pointcloud:
        raise HTTPException(status_code=404, detail="点云数据不存在")
    
    file_path = Path(pointcloud.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="点云文件已被删除")
    
    return FileResponse(
        path=str(file_path),
        filename=pointcloud.file_name,
        media_type="application/octet-stream"
    )

@router.get("/{pointcloud_id}/detect-holes")
async def detect_bullet_holes(
    pointcloud_id: int,
    threshold: float = 0.3,
    use_optimized: bool = True,
    session: AsyncSession = Depends(get_session)
):
    """
    检测弹孔特征
    优化版算法降低误报率
    """
    result = await session.execute(
        select(PointCloudData).where(PointCloudData.id == pointcloud_id)
    )
    pointcloud = result.scalar_one_or_none()
    
    if not pointcloud:
        raise HTTPException(status_code=404, detail="点云数据不存在")
    
    file_path = Path(pointcloud.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="点云文件已被删除")
    
    try:
        pcd, _ = processor.load_point_cloud(str(file_path))
        
        pcd_downsampled = processor.downsample_point_cloud(pcd, voxel_size=0.02)
        
        if not pcd_downsampled.has_normals():
            pcd_downsampled = processor.compute_normals(pcd_downsampled)
        
        if use_optimized:
            candidates = optimized_detector.detect_holes_optimized(
                pcd_downsampled,
                min_normal_variance=threshold,
                neighborhood_radius=0.08
            )
        else:
            candidates = processor.detect_normal_changes(
                pcd_downsampled,
                threshold=threshold
            )
        
        return {
            "pointcloud_id": pointcloud_id,
            "candidate_count": len(candidates),
            "algorithm": "optimized" if use_optimized else "original",
            "candidates": candidates
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"弹孔检测失败: {str(e)}")

@router.post("/{pointcloud_id}/generate-lod")
async def generate_lod_pyramid(
    pointcloud_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    为已存在的点云生成LOD金字塔
    """
    result = await session.execute(
        select(PointCloudData).where(PointCloudData.id == pointcloud_id)
    )
    pointcloud = result.scalar_one_or_none()
    
    if not pointcloud:
        raise HTTPException(status_code=404, detail="点云数据不存在")
    
    file_path = Path(pointcloud.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="点云文件已被删除")
    
    try:
        streaming_proc = StreamingPointCloudProcessor()
        lod_dir = settings.UPLOAD_DIR / "lod" / str(pointcloud_id)
        
        lod_info = streaming_proc.generate_lod_pyramid(
            str(file_path),
            str(lod_dir),
            str(pointcloud_id)
        )
        
        for lod_level, lod_data in lod_info.items():
            db_lod = PointCloudLOD(
                point_cloud_id=pointcloud_id,
                lod_level=lod_level,
                file_path=lod_data['file_path'],
                point_count=lod_data['point_count'],
                voxel_size=lod_data['voxel_size']
            )
            session.add(db_lod)
        
        await session.commit()
        
        return {
            "message": "LOD金字塔生成完成",
            "lod_levels": list(lod_info.keys()),
            "total_points_generated": sum(l['point_count'] for l in lod_info.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LOD生成失败: {str(e)}")

@router.get("/list", response_model=List[PointCloudUploadResponse])
async def list_point_clouds(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    """列出所有点云文件"""
    result = await session.execute(
        select(PointCloudData).offset(skip).limit(limit).order_by(PointCloudData.upload_time.desc())
    )
    pointclouds = result.scalars().all()
    
    return [
        PointCloudUploadResponse(
            id=pc.id,
            file_name=pc.file_name,
            file_type=pc.file_type,
            upload_time=pc.upload_time,
            point_count=pc.point_count,
            bounds_min=Point3D(**pc.bounds_min) if pc.bounds_min else None,
            bounds_max=Point3D(**pc.bounds_max) if pc.bounds_max else None
        )
        for pc in pointclouds
    ]
