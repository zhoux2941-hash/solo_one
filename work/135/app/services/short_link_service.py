from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import UploadFile
import csv
import io
import logging

from app.models.database import ShortLink, Click, SessionLocal
from app.core.short_code import short_code_generator, ShortCodeGenerator
from app.core.redis_client import redis_client
from app.core.streaming_csv import StreamingCSVParser, create_streaming_parser, validate_csv_headers
from app.schemas.short_link import (
    ShortLinkCreate, 
    ShortLinkResponse, 
    ShortLinkDetail,
    ShortLinkBatchCreate,
    BatchImportResult,
    ExpiryType
)
from config import settings

logger = logging.getLogger(__name__)


class ShortLinkService:
    def __init__(self, db: Session):
        self.db = db
        self.generator = short_code_generator
    
    def _get_short_url(self, short_code: str, custom_short_code: Optional[str] = None) -> str:
        display_code = custom_short_code or short_code
        return f"{settings.BASE_URL}/{display_code}"
    
    def _calculate_expires_at(
        self, 
        expiry_type: ExpiryType, 
        expiry_days: Optional[int] = None, 
        expires_at: Optional[datetime] = None
    ) -> Optional[datetime]:
        if expiry_type == ExpiryType.NEVER:
            return None
        elif expiry_type == ExpiryType.RELATIVE and expiry_days:
            return datetime.utcnow() + timedelta(days=expiry_days)
        elif expiry_type == ExpiryType.ABSOLUTE and expires_at:
            return expires_at
        return None
    
    def _is_short_code_available(self, short_code: str) -> bool:
        if redis_client.exists(f"short_code:{short_code}"):
            return False
        
        exists = self.db.query(ShortLink).filter(
            (ShortLink.short_code == short_code) | 
            (ShortLink.custom_short_code == short_code)
        ).first()
        
        return exists is None
    
    def create_short_link(self, create_data: ShortLinkCreate) -> ShortLinkResponse:
        if create_data.custom_short_code:
            is_valid, error_msg = self.generator.validate_custom_short_code(create_data.custom_short_code)
            if not is_valid:
                raise ValueError(error_msg)
            
            if not self._is_short_code_available(create_data.custom_short_code):
                raise ValueError(f"Custom short code '{create_data.custom_short_code}' is already in use")
            
            short_code = self.generator.generate_unique(self.db, create_data.original_url)
            custom_short_code = create_data.custom_short_code
        else:
            short_code = self.generator.generate_unique(self.db, create_data.original_url)
            custom_short_code = None
        
        expires_at = self._calculate_expires_at(
            create_data.expiry_type,
            create_data.expiry_days,
            create_data.expires_at
        )
        
        short_link = ShortLink(
            short_code=short_code,
            custom_short_code=custom_short_code,
            original_url=create_data.original_url,
            expires_at=expires_at,
            total_clicks=0,
            is_active="active"
        )
        
        self.db.add(short_link)
        self.db.commit()
        self.db.refresh(short_link)
        
        display_code = custom_short_code or short_code
        cache_data = {
            'original_url': short_link.original_url,
            'is_expired': short_link.is_expired,
            'is_active': short_link.is_active,
            'id': short_link.id
        }
        redis_client.set(f"short_code:{display_code}", cache_data, ttl=settings.CACHE_TTL)
        
        return ShortLinkResponse(
            id=short_link.id,
            short_code=short_link.short_code,
            custom_short_code=short_link.custom_short_code,
            original_url=short_link.original_url,
            short_url=self._get_short_url(short_link.short_code, short_link.custom_short_code),
            expires_at=short_link.expires_at,
            created_at=short_link.created_at,
            total_clicks=short_link.total_clicks,
            is_active=short_link.is_active,
            is_expired=short_link.is_expired
        )
    
    def get_short_link_by_code(self, short_code: str) -> Optional[ShortLink]:
        cached = redis_client.get(f"short_code:{short_code}")
        
        if cached:
            if cached.get('is_expired', False):
                return None
            if cached.get('is_active') != 'active':
                return None
            
            db_link = self.db.query(ShortLink).filter(
                (ShortLink.short_code == short_code) | 
                (ShortLink.custom_short_code == short_code)
            ).first()
            
            if db_link:
                return db_link
        
        short_link = self.db.query(ShortLink).filter(
            (ShortLink.short_code == short_code) | 
            (ShortLink.custom_short_code == short_code)
        ).first()
        
        if short_link:
            cache_data = {
                'original_url': short_link.original_url,
                'is_expired': short_link.is_expired,
                'is_active': short_link.is_active,
                'id': short_link.id
            }
            redis_client.set(f"short_code:{short_code}", cache_data, ttl=settings.CACHE_TTL)
        
        return short_link
    
    def get_short_link_detail(self, short_link_id: int) -> Optional[ShortLinkDetail]:
        short_link = self.db.query(ShortLink).filter(ShortLink.id == short_link_id).first()
        
        if not short_link:
            return None
        
        return ShortLinkDetail(
            id=short_link.id,
            short_code=short_link.short_code,
            custom_short_code=short_link.custom_short_code,
            original_url=short_link.original_url,
            short_url=self._get_short_url(short_link.short_code, short_link.custom_short_code),
            expires_at=short_link.expires_at,
            created_at=short_link.created_at,
            updated_at=short_link.updated_at,
            total_clicks=short_link.total_clicks,
            is_active=short_link.is_active,
            is_expired=short_link.is_expired
        )
    
    def delete_short_link(self, short_link_id: int) -> bool:
        short_link = self.db.query(ShortLink).filter(ShortLink.id == short_link_id).first()
        
        if not short_link:
            return False
        
        display_code = short_link.custom_short_code or short_link.short_code
        redis_client.delete(f"short_code:{display_code}")
        
        self.db.delete(short_link)
        self.db.commit()
        
        return True
    
    def _parse_row_data(self, row: Dict[str, Any]) -> ShortLinkCreate:
        original_url = row.get('original_url', '').strip()
        custom_short_code = row.get('custom_short_code', '').strip() or None
        expiry_type_str = row.get('expiry_type', 'never').strip().lower()
        expiry_days_str = row.get('expiry_days', '').strip()
        expires_at_str = row.get('expires_at', '').strip()
        
        if not original_url:
            raise ValueError("original_url is required")
        
        expiry_type = ExpiryType(expiry_type_str) if expiry_type_str in ['absolute', 'relative', 'never'] else ExpiryType.NEVER
        
        expiry_days = None
        if expiry_days_str:
            try:
                expiry_days = int(expiry_days_str)
            except ValueError:
                raise ValueError(f"Invalid expiry_days: {expiry_days_str}")
        
        expires_at = None
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError(f"Invalid expires_at format: {expires_at_str}")
        
        return ShortLinkCreate(
            original_url=original_url,
            custom_short_code=custom_short_code,
            expiry_type=expiry_type,
            expiry_days=expiry_days,
            expires_at=expires_at
        )
    
    def _create_short_link_batch(
        self,
        create_data_list: List[ShortLinkCreate],
        batch_db: Session
    ) -> List[ShortLinkResponse]:
        results = []
        short_links_to_add = []
        cache_operations = []
        
        for create_data in create_data_list:
            if create_data.custom_short_code:
                is_valid, error_msg = self.generator.validate_custom_short_code(create_data.custom_short_code)
                if not is_valid:
                    raise ValueError(error_msg)
                
                exists = batch_db.query(ShortLink).filter(
                    (ShortLink.short_code == create_data.custom_short_code) | 
                    (ShortLink.custom_short_code == create_data.custom_short_code)
                ).first()
                
                if exists:
                    raise ValueError(f"Custom short code '{create_data.custom_short_code}' is already in use")
                
                short_code = self.generator.generate_unique(batch_db, create_data.original_url)
                custom_short_code = create_data.custom_short_code
            else:
                short_code = self.generator.generate_unique(batch_db, create_data.original_url)
                custom_short_code = None
            
            expires_at = self._calculate_expires_at(
                create_data.expiry_type,
                create_data.expiry_days,
                create_data.expires_at
            )
            
            short_link = ShortLink(
                short_code=short_code,
                custom_short_code=custom_short_code,
                original_url=create_data.original_url,
                expires_at=expires_at,
                total_clicks=0,
                is_active="active"
            )
            
            short_links_to_add.append(short_link)
            
            display_code = custom_short_code or short_code
            cache_data = {
                'original_url': short_link.original_url,
                'is_expired': False,
                'is_active': 'active',
                'id': None
            }
            cache_operations.append((display_code, cache_data, short_link))
        
        for sl in short_links_to_add:
            batch_db.add(sl)
        
        batch_db.commit()
        
        for display_code, cache_data, short_link in cache_operations:
            cache_data['id'] = short_link.id
            redis_client.set(f"short_code:{display_code}", cache_data, ttl=settings.CACHE_TTL)
            
            results.append(ShortLinkResponse(
                id=short_link.id,
                short_code=short_link.short_code,
                custom_short_code=short_link.custom_short_code,
                original_url=short_link.original_url,
                short_url=self._get_short_url(short_link.short_code, short_link.custom_short_code),
                expires_at=short_link.expires_at,
                created_at=short_link.created_at,
                total_clicks=short_link.total_clicks,
                is_active=short_link.is_active,
                is_expired=short_link.is_expired
            ))
        
        return results
    
    def import_from_csv(self, file: UploadFile) -> BatchImportResult:
        success_count = 0
        failed_count = 0
        errors = []
        created_links = []
        batch_buffer: List[ShortLinkCreate] = []
        row_number = 1
        
        parser = create_streaming_parser()
        
        first_chunk = file.file.read(settings.CSV_CHUNK_SIZE)
        if isinstance(first_chunk, bytes):
            try:
                first_chunk_str = first_chunk.decode('utf-8-sig')
            except UnicodeDecodeError:
                first_chunk_str = first_chunk.decode('latin-1', errors='replace')
        else:
            first_chunk_str = first_chunk
        
        lines = first_chunk_str.splitlines()
        if not lines:
            raise ValueError("Empty CSV file")
        
        header_line = lines[0]
        headers = next(csv.reader(io.StringIO(header_line)))
        headers = [h.strip() for h in headers]
        
        is_valid, missing = validate_csv_headers(headers, ['original_url'])
        if not is_valid:
            raise ValueError(f"Missing required columns: {', '.join(missing)}")
        
        remaining = '\n'.join(lines[1:]) if len(lines) > 1 else ''
        
        if remaining:
            parser._buffer = remaining
            parser._headers = headers
        
        batch_size = settings.DB_BATCH_SIZE
        
        try:
            for row in parser.parse_file(file):
                row_number += 1
                
                try:
                    create_data = self._parse_row_data(row)
                    batch_buffer.append(create_data)
                    
                    if len(batch_buffer) >= batch_size:
                        batch_db = SessionLocal()
                        try:
                            results = self._create_short_link_batch(batch_buffer, batch_db)
                            created_links.extend(results[:100])
                            success_count += len(results)
                            batch_db.commit()
                            logger.info(f"Processed batch: {len(results)} records, total: {success_count}")
                        except Exception as e:
                            batch_db.rollback()
                            failed_count += len(batch_buffer)
                            errors.append({
                                'row': f"batch starting at row {row_number - len(batch_buffer) + 1}",
                                'error': str(e),
                                'batch_size': len(batch_buffer)
                            })
                            logger.error(f"Batch error: {e}")
                        finally:
                            batch_db.close()
                            batch_buffer = []
                    
                except Exception as e:
                    failed_count += 1
                    errors.append({
                        'row': row_number,
                        'error': str(e),
                        'data': row
                    })
            
            if batch_buffer:
                batch_db = SessionLocal()
                try:
                    results = self._create_short_link_batch(batch_buffer, batch_db)
                    if len(created_links) < 100:
                        created_links.extend(results[:100 - len(created_links)])
                    success_count += len(results)
                    batch_db.commit()
                    logger.info(f"Processed final batch: {len(results)} records, total: {success_count}")
                except Exception as e:
                    batch_db.rollback()
                    failed_count += len(batch_buffer)
                    errors.append({
                        'row': f"final batch starting at row {row_number - len(batch_buffer) + 1}",
                        'error': str(e),
                        'batch_size': len(batch_buffer)
                    })
                finally:
                    batch_db.close()
        
        except Exception as e:
            logger.error(f"CSV parsing error: {e}")
            raise ValueError(f"CSV parsing error: {e}")
        
        return BatchImportResult(
            success=success_count,
            failed=failed_count,
            errors=errors,
            created_links=created_links
        )


def get_short_link_service(db: Session) -> ShortLinkService:
    return ShortLinkService(db)
