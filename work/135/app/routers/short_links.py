from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.models.database import get_db, ShortLink
from app.schemas.short_link import (
    ShortLinkCreate,
    ShortLinkResponse,
    ShortLinkDetail,
    BatchImportResult
)
from app.services.short_link_service import ShortLinkService, get_short_link_service
from app.services.click_service import ClickService, get_click_service
from app.core.qr_generator import get_qr_generator, QRGenerator, QRConfig
from app.core.cache_warmer import get_cache_warmer, CacheWarmer
from config import settings

router = APIRouter(
    prefix=f"{settings.API_PREFIX}/short-links",
    tags=["short-links"]
)

logger = logging.getLogger(__name__)


@router.post("/", response_model=ShortLinkResponse, status_code=201)
def create_short_link(
    create_data: ShortLinkCreate,
    db: Session = Depends(get_db)
):
    service = get_short_link_service(db)
    try:
        return service.create_short_link(create_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{short_code}/detail", response_model=ShortLinkDetail)
def get_short_link_detail(
    short_code: str,
    db: Session = Depends(get_db)
):
    service = get_short_link_service(db)
    
    short_link = service.get_short_link_by_code(short_code)
    if not short_link:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    detail = service.get_short_link_detail(short_link.id)
    if not detail:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    return detail


@router.get("/{short_code}", response_model=ShortLinkResponse)
def get_short_link_info(
    short_code: str,
    db: Session = Depends(get_db)
):
    service = get_short_link_service(db)
    
    short_link = service.get_short_link_by_code(short_code)
    if not short_link:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    display_code = short_link.custom_short_code or short_link.short_code
    short_url = f"{settings.BASE_URL}/{display_code}"
    
    return ShortLinkResponse(
        id=short_link.id,
        short_code=short_link.short_code,
        custom_short_code=short_link.custom_short_code,
        original_url=short_link.original_url,
        short_url=short_url,
        expires_at=short_link.expires_at,
        created_at=short_link.created_at,
        total_clicks=short_link.total_clicks,
        is_active=short_link.is_active,
        is_expired=short_link.is_expired
    )


@router.delete("/{short_link_id}", status_code=204)
def delete_short_link(
    short_link_id: int,
    db: Session = Depends(get_db)
):
    service = get_short_link_service(db)
    
    if not service.delete_short_link(short_link_id):
        raise HTTPException(status_code=404, detail="Short link not found")
    
    return JSONResponse(status_code=204, content=None)


@router.post("/import/csv", response_model=BatchImportResult, status_code=201)
def import_short_links_from_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    service = get_short_link_service(db)
    
    try:
        return service.import_from_csv(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{short_code}/statistics")
def get_short_link_statistics(
    short_code: str,
    db: Session = Depends(get_db)
):
    short_link_service = get_short_link_service(db)
    click_service = get_click_service(db)
    
    short_link = short_link_service.get_short_link_by_code(short_code)
    if not short_link:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    stats = click_service.get_statistics(short_link.id)
    if not stats:
        raise HTTPException(status_code=404, detail="Statistics not found")
    
    return stats


@router.get("/dashboard/overview")
def get_overview_statistics(
    db: Session = Depends(get_db)
):
    click_service = get_click_service(db)
    return click_service.get_all_time_statistics()


@router.get("/{short_code}/qr")
def generate_qr_code(
    short_code: str,
    db: Session = Depends(get_db),
    size: Optional[int] = Query(None, ge=100, le=1000, description="QR image size in pixels"),
    box_size: Optional[int] = Query(None, ge=1, le=50, description="Size of each QR box"),
    border: Optional[int] = Query(None, ge=0, le=20, description="Border width in boxes"),
    fill_color: str = Query("black", description="QR code color"),
    back_color: str = Query("white", description="Background color"),
    use_cache: bool = Query(True, description="Use Redis cache for generated QR"),
):
    qr_gen = get_qr_generator()
    
    if not qr_gen.is_available():
        raise HTTPException(
            status_code=501,
            detail="QR code generation not available. Install qrcode and pillow packages."
        )
    
    short_link_service = get_short_link_service(db)
    short_link = short_link_service.get_short_link_by_code(short_code)
    
    if not short_link:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    if short_link.is_expired:
        raise HTTPException(
            status_code=410,
            detail="Short link has expired"
        )
    
    if short_link.is_active != 'active':
        raise HTTPException(status_code=404, detail="Short link is inactive")
    
    display_code = short_link.custom_short_code or short_link.short_code
    short_url = f"{settings.BASE_URL}/{display_code}"
    
    config = None
    if any([size, box_size, border, fill_color != "black", back_color != "white"]):
        config = QRConfig(
            version=settings.QR_VERSION,
            error_correct=settings.QR_ERROR_CORRECT_LEVEL,
            box_size=box_size or settings.QR_BOX_SIZE,
            border=border if border is not None else settings.QR_BORDER,
            fill_color=fill_color,
            back_color=back_color,
            size=size,
        )
    
    try:
        qr_base64 = qr_gen.generate_qr_base64(
            url=short_url,
            config=config,
            use_cache=use_cache
        )
        
        return {
            "short_code": short_code,
            "short_url": short_url,
            "original_url": short_link.original_url,
            "qr_code": qr_base64,
            "format": "PNG",
            "cached": use_cache
        }
        
    except Exception as e:
        logger.error(f"QR generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {e}")


@router.get("/{short_code}/qr/raw")
def get_qr_raw(
    short_code: str,
    db: Session = Depends(get_db),
    size: Optional[int] = Query(None, ge=100, le=1000),
):
    from fastapi.responses import Response
    
    qr_gen = get_qr_generator()
    
    if not qr_gen.is_available():
        raise HTTPException(
            status_code=501,
            detail="QR code generation not available"
        )
    
    short_link_service = get_short_link_service(db)
    short_link = short_link_service.get_short_link_by_code(short_code)
    
    if not short_link:
        raise HTTPException(status_code=404, detail="Short link not found")
    
    display_code = short_link.custom_short_code or short_link.short_code
    short_url = f"{settings.BASE_URL}/{display_code}"
    
    config = None
    if size:
        config = QRConfig(
            version=settings.QR_VERSION,
            error_correct=settings.QR_ERROR_CORRECT_LEVEL,
            box_size=settings.QR_BOX_SIZE,
            border=settings.QR_BORDER,
            fill_color=settings.QR_FILL_COLOR,
            back_color=settings.QR_BACK_COLOR,
            size=size,
        )
    
    try:
        qr_bytes = qr_gen.generate_qr_bytes(
            url=short_url,
            config=config
        )
        
        return Response(
            content=qr_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename={short_code}.png"
            }
        )
        
    except Exception as e:
        logger.error(f"QR raw generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {e}")


@router.post("/cache/warmup")
def trigger_cache_warmup(
    hours: Optional[int] = Query(None, ge=1, le=168, description="Hours to look back for hot links"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maximum number of links to warmup"),
):
    warmer = get_cache_warmer()
    
    try:
        result = warmer.warmup_cache(hours=hours, limit=limit)
        return result
    except Exception as e:
        logger.error(f"Cache warmup error: {e}")
        raise HTTPException(status_code=500, detail=f"Cache warmup failed: {e}")


@router.get("/cache/hot")
def get_hot_shortcodes():
    warmer = get_cache_warmer()
    
    hot_list = warmer.get_hot_list()
    
    if not hot_list:
        return {
            "message": "No hot shortcodes cached. Trigger warmup first.",
            "shortcodes": []
        }
    
    return {
        "generated_at": hot_list.get("generated_at"),
        "hours": hot_list.get("hours"),
        "limit": hot_list.get("limit"),
        "count": len(hot_list.get("shortcodes", [])),
        "shortcodes": hot_list.get("shortcodes", [])
    }
