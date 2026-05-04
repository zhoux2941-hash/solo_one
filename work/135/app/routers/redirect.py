from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.models.database import get_db, ShortLink
from app.core.redis_client import redis_client
from app.core.singleflight import singleflight
from app.services.short_link_service import ShortLinkService, get_short_link_service
from app.services.click_service import ClickService, get_click_service
from config import settings

router = APIRouter(tags=["redirect"])
logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> Optional[str]:
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip
    
    try:
        return request.client.host
    except Exception:
        return None


def _lookup_short_link(short_code: str, db: Session) -> Optional[dict]:
    cached = redis_client.get(f"short_code:{short_code}")
    
    if cached:
        logger.debug(f"Cache hit for short_code: {short_code}")
        return cached
    
    logger.debug(f"Cache miss for short_code: {short_code}, querying DB")
    
    short_link = db.query(ShortLink).filter(
        (ShortLink.short_code == short_code) | 
        (ShortLink.custom_short_code == short_code)
    ).first()
    
    if not short_link:
        return None
    
    result = {
        'id': short_link.id,
        'original_url': short_link.original_url,
        'is_expired': short_link.is_expired,
        'is_active': short_link.is_active,
    }
    
    redis_client.set(f"short_code:{short_code}", result, ttl=settings.CACHE_TTL)
    
    return result


async def _lookup_short_link_with_singleflight(short_code: str, db: Session) -> Optional[dict]:
    async def fetch_func():
        return _lookup_short_link(short_code, db)
    
    result, is_primary = await singleflight.execute_async(
        key=f"lookup:{short_code}",
        fn=lambda: fetch_func()
    )
    
    if not is_primary:
        logger.debug(f"SingleFlight: using result from concurrent request for: {short_code}")
    
    return result


def _build_410_response(expires_at: Optional[datetime]) -> JSONResponse:
    return JSONResponse(
        status_code=410,
        content={
            "error": "Gone",
            "message": "This short link has expired",
            "expired_at": expires_at.isoformat() if expires_at else None
        }
    )


@router.get("/{short_code}")
async def redirect_to_original(
    short_code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    click_service = get_click_service(db)
    
    short_link_data = await _lookup_short_link_with_singleflight(short_code, db)
    
    if not short_link_data:
        db_link = db.query(ShortLink).filter(
            (ShortLink.short_code == short_code) | 
            (ShortLink.custom_short_code == short_code)
        ).first()
        
        if db_link:
            if db_link.is_expired:
                return _build_410_response(db_link.expires_at)
            if db_link.is_active != 'active':
                raise HTTPException(status_code=404, detail="Short link not found or inactive")
        
        raise HTTPException(status_code=404, detail="Short link not found")
    
    if short_link_data.get('is_expired', False):
        db_link = db.query(ShortLink).filter(
            (ShortLink.short_code == short_code) | 
            (ShortLink.custom_short_code == short_code)
        ).first()
        expires_at = db_link.expires_at if db_link else None
        return _build_410_response(expires_at)
    
    if short_link_data.get('is_active') != 'active':
        raise HTTPException(status_code=404, detail="Short link not found or inactive")
    
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    referer = request.headers.get("Referer")
    
    try:
        short_link_id = short_link_data.get('id')
        if short_link_id:
            click_service.record_click(
                short_link_id=short_link_id,
                ip_address=client_ip,
                user_agent_string=user_agent,
                referer=referer
            )
    except Exception as e:
        logger.error(f"Error recording click: {e}")
    
    return RedirectResponse(
        url=short_link_data['original_url'],
        status_code=302
    )


@router.head("/{short_code}")
async def check_short_link_head(
    short_code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    short_link_data = await _lookup_short_link_with_singleflight(short_code, db)
    
    if not short_link_data:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    if short_link_data.get('is_expired', False):
        return JSONResponse(status_code=410, content={})
    
    if short_link_data.get('is_active') != 'active':
        raise HTTPException(status_code=404, detail="Short link not found or inactive")
    
    return JSONResponse(
        status_code=200,
        content={},
        headers={"Location": short_link_data['original_url']}
    )
