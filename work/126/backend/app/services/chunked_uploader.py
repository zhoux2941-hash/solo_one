import os
import uuid
import hashlib
import aiofiles
import aiofiles.os
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import shutil

from ..models.database import ChunkedUpload, PointCloudData
from ..config import settings

class ChunkedUploader:
    CHUNK_SIZE = 50 * 1024 * 1024
    
    def __init__(self):
        self.temp_base_dir = settings.UPLOAD_DIR / "chunked_temp"
    
    async def init_upload(self, 
                          session: AsyncSession,
                          file_name: str,
                          file_size: int,
                          chunk_size: Optional[int] = None) -> Dict[str, Any]:
        """初始化分片上传"""
        chunk_size = chunk_size or self.CHUNK_SIZE
        
        file_ext = Path(file_name).suffix.lower().lstrip('.')
        if file_ext not in ['las', 'ply']:
            raise ValueError(f"不支持的文件格式: {file_ext}")
        
        total_chunks = (file_size + chunk_size - 1) // chunk_size
        
        upload_id = str(uuid.uuid4()).replace('-', '')
        
        temp_dir = self.temp_base_dir / upload_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        upload = ChunkedUpload(
            upload_id=upload_id,
            file_name=file_name,
            file_type=file_ext,
            total_size=file_size,
            total_chunks=total_chunks,
            chunk_size=chunk_size,
            status='pending',
            temp_dir=str(temp_dir)
        )
        
        session.add(upload)
        await session.commit()
        await session.refresh(upload)
        
        return {
            'upload_id': upload_id,
            'chunk_size': chunk_size,
            'total_chunks': total_chunks,
            'file_name': file_name
        }
    
    async def upload_chunk(self,
                           session: AsyncSession,
                           upload_id: str,
                           chunk_index: int,
                           chunk_data: bytes,
                           chunk_hash: Optional[str] = None) -> Dict[str, Any]:
        """上传单个分片"""
        result = await session.execute(
            select(ChunkedUpload).where(ChunkedUpload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()
        
        if not upload:
            raise ValueError(f"上传任务不存在: {upload_id}")
        
        if upload.status == 'completed':
            raise ValueError("上传任务已完成")
        
        if chunk_index < 0 or chunk_index >= upload.total_chunks:
            raise ValueError(f"分片索引超出范围: {chunk_index}")
        
        if chunk_hash:
            actual_hash = hashlib.md5(chunk_data).hexdigest()
            if actual_hash != chunk_hash:
                raise ValueError("分片校验失败")
        
        temp_dir = Path(upload.temp_dir)
        chunk_file = temp_dir / f"chunk_{chunk_index:06d}.part"
        
        async with aiofiles.open(str(chunk_file), 'wb') as f:
            await f.write(chunk_data)
        
        uploaded_chunks = len(list(temp_dir.glob("chunk_*.part")))
        
        upload.uploaded_chunks = uploaded_chunks
        upload.status = 'uploading'
        await session.commit()
        
        is_complete = uploaded_chunks == upload.total_chunks
        
        return {
            'upload_id': upload_id,
            'chunk_index': chunk_index,
            'uploaded_chunks': uploaded_chunks,
            'total_chunks': upload.total_chunks,
            'is_complete': is_complete,
            'progress': uploaded_chunks / upload.total_chunks
        }
    
    async def get_upload_status(self,
                                 session: AsyncSession,
                                 upload_id: str) -> Dict[str, Any]:
        """获取上传状态"""
        result = await session.execute(
            select(ChunkedUpload).where(ChunkedUpload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()
        
        if not upload:
            raise ValueError(f"上传任务不存在: {upload_id}")
        
        temp_dir = Path(upload.temp_dir)
        uploaded_chunks = len(list(temp_dir.glob("chunk_*.part")))
        
        return {
            'upload_id': upload_id,
            'file_name': upload.file_name,
            'total_size': upload.total_size,
            'total_chunks': upload.total_chunks,
            'uploaded_chunks': uploaded_chunks,
            'chunk_size': upload.chunk_size,
            'status': upload.status,
            'progress': uploaded_chunks / upload.total_chunks if upload.total_chunks > 0 else 0
        }
    
    async def merge_chunks(self,
                           session: AsyncSession,
                           upload_id: str) -> str:
        """合并分片"""
        result = await session.execute(
            select(ChunkedUpload).where(ChunkedUpload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()
        
        if not upload:
            raise ValueError(f"上传任务不存在: {upload_id}")
        
        temp_dir = Path(upload.temp_dir)
        chunk_files = sorted(temp_dir.glob("chunk_*.part"))
        
        if len(chunk_files) != upload.total_chunks:
            raise ValueError(f"分片不完整，期望 {upload.total_chunks}，实际 {len(chunk_files)}")
        
        output_file = settings.UPLOAD_DIR / f"{upload_id}.{upload.file_type}"
        
        total_size = 0
        async with aiofiles.open(str(output_file), 'wb') as outfile:
            for chunk_file in chunk_files:
                async with aiofiles.open(str(chunk_file), 'rb') as infile:
                    while True:
                        chunk = await infile.read(1024 * 1024)
                        if not chunk:
                            break
                        await outfile.write(chunk)
                        total_size += len(chunk)
        
        await self._cleanup_chunks(upload_id, temp_dir)
        
        upload.status = 'completed'
        await session.commit()
        
        return str(output_file)
    
    async def _cleanup_chunks(self, upload_id: str, temp_dir: Path):
        """清理临时分片文件"""
        try:
            shutil.rmtree(str(temp_dir), ignore_errors=True)
        except Exception as e:
            print(f"清理临时文件失败: {e}")
    
    async def cancel_upload(self,
                            session: AsyncSession,
                            upload_id: str):
        """取消上传"""
        result = await session.execute(
            select(ChunkedUpload).where(ChunkedUpload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()
        
        if upload:
            await self._cleanup_chunks(upload_id, Path(upload.temp_dir))
            upload.status = 'cancelled'
            await session.commit()
    
    async def get_missing_chunks(self,
                                  session: AsyncSession,
                                  upload_id: str) -> list:
        """获取缺失的分片索引"""
        result = await session.execute(
            select(ChunkedUpload).where(ChunkedUpload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()
        
        if not upload:
            raise ValueError(f"上传任务不存在: {upload_id}")
        
        temp_dir = Path(upload.temp_dir)
        existing_chunks = set()
        
        for chunk_file in temp_dir.glob("chunk_*.part"):
            try:
                chunk_idx = int(chunk_file.stem.split('_')[1])
                existing_chunks.add(chunk_idx)
            except (ValueError, IndexError):
                continue
        
        missing = [i for i in range(upload.total_chunks) if i not in existing_chunks]
        return missing
