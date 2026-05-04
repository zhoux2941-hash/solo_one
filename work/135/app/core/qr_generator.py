import io
import base64
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

try:
    import qrcode
    from PIL import Image
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False

from app.core.redis_client import redis_client
from config import settings

logger = logging.getLogger(__name__)


@dataclass
class QRConfig:
    version: int = 1
    error_correct: int = 0
    box_size: int = 10
    border: int = 4
    fill_color: str = "black"
    back_color: str = "white"
    size: Optional[int] = None


class QRGenerator:
    def __init__(self):
        self._default_config = self._get_default_config()
    
    def _get_default_config(self) -> QRConfig:
        return QRConfig(
            version=settings.QR_VERSION,
            error_correct=settings.QR_ERROR_CORRECT_LEVEL,
            box_size=settings.QR_BOX_SIZE,
            border=settings.QR_BORDER,
            fill_color=settings.QR_FILL_COLOR,
            back_color=settings.QR_BACK_COLOR,
        )
    
    def _get_cache_key(self, url: str, config: QRConfig) -> str:
        import hashlib
        config_str = f"{config.version}:{config.error_correct}:{config.box_size}:{config.border}:{config.fill_color}:{config.back_color}:{config.size or ''}"
        combined = f"{url}:{config_str}"
        return f"qr:cache:{hashlib.md5(combined.encode()).hexdigest()}"
    
    def generate_qr_image(
        self,
        url: str,
        config: Optional[QRConfig] = None
    ) -> Image.Image:
        if not QR_AVAILABLE:
            raise ImportError("qrcode and pillow packages are required")
        
        if not url:
            raise ValueError("URL cannot be empty")
        
        cfg = config or self._default_config
        
        qr = qrcode.QRCode(
            version=cfg.version,
            error_correction=cfg.error_correct,
            box_size=cfg.box_size,
            border=cfg.border,
        )
        
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(
            fill_color=cfg.fill_color,
            back_color=cfg.back_color
        )
        
        if cfg.size and cfg.size > 0:
            img = img.resize((cfg.size, cfg.size), Image.Resampling.LANCZOS)
        
        return img
    
    def generate_qr_base64(
        self,
        url: str,
        config: Optional[QRConfig] = None,
        use_cache: bool = True,
        format: str = "PNG"
    ) -> str:
        if not QR_AVAILABLE:
            raise ImportError("qrcode and pillow packages are required")
        
        cfg = config or self._default_config
        
        if use_cache:
            cache_key = self._get_cache_key(url, cfg)
            cached = redis_client.get(cache_key)
            if cached:
                logger.debug(f"QR cache hit for: {url}")
                return cached
        
        img = self.generate_qr_image(url, cfg)
        
        buffer = io.BytesIO()
        img.save(buffer, format=format.upper())
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        data_uri = f"data:image/{format.lower()};base64,{img_base64}"
        
        if use_cache:
            cache_key = self._get_cache_key(url, cfg)
            redis_client.set(cache_key, data_uri, ttl=settings.CACHE_TTL)
        
        return data_uri
    
    def generate_qr_bytes(
        self,
        url: str,
        config: Optional[QRConfig] = None,
        format: str = "PNG"
    ) -> bytes:
        if not QR_AVAILABLE:
            raise ImportError("qrcode and pillow packages are required")
        
        img = self.generate_qr_image(url, config)
        
        buffer = io.BytesIO()
        img.save(buffer, format=format.upper())
        buffer.seek(0)
        
        return buffer.getvalue()
    
    def generate_with_logo(
        self,
        url: str,
        logo_path: str,
        logo_ratio: float = 0.2,
        config: Optional[QRConfig] = None
    ) -> str:
        if not QR_AVAILABLE:
            raise ImportError("qrcode and pillow packages are required")
        
        img = self.generate_qr_image(url, config)
        
        logo = Image.open(logo_path).convert("RGBA")
        
        qr_width, qr_height = img.size
        logo_width = int(qr_width * logo_ratio)
        logo_height = int(qr_height * logo_ratio)
        
        logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
        
        x = (qr_width - logo_width) // 2
        y = (qr_height - logo_height) // 2
        
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        img.paste(logo, (x, y), logo)
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{img_base64}"
    
    def is_available(self) -> bool:
        return QR_AVAILABLE


qr_generator = QRGenerator()


def get_qr_generator() -> QRGenerator:
    return qr_generator
