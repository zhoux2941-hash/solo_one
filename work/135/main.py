from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.models.database import init_db
from app.routers import short_links, redirect
from app.core.geoip import geoip_service
from app.core.elasticsearch_client import get_elasticsearch_client
from app.core.cache_warmer import get_cache_warmer
from config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
    
    logger.info("Initializing Elasticsearch...")
    try:
        es_client = get_elasticsearch_client()
        if es_client.is_available():
            logger.info("Elasticsearch connected successfully")
        else:
            logger.warning("Elasticsearch not available, will fall back to PostgreSQL")
    except Exception as e:
        logger.warning(f"Elasticsearch initialization failed: {e}")
    
    logger.info("Initializing cache warmer...")
    try:
        cache_warmer = get_cache_warmer()
        await cache_warmer.start_background_warmup()
        logger.info("Cache warmer started, interval: %d seconds", settings.CACHE_WARMUP_INTERVAL)
    except Exception as e:
        logger.warning(f"Cache warmer initialization failed: {e}")
    
    yield
    
    logger.info("Shutting down...")
    
    try:
        cache_warmer = get_cache_warmer()
        await cache_warmer.stop_background_warmup()
        logger.info("Cache warmer stopped")
    except Exception as e:
        logger.error(f"Error stopping cache warmer: {e}")
    
    try:
        geoip_service.close()
        logger.info("GeoIP service closed")
    except Exception as e:
        logger.error(f"Error closing GeoIP: {e}")
    
    try:
        es_client = get_elasticsearch_client()
        es_client.close()
        logger.info("Elasticsearch client closed")
    except Exception as e:
        logger.error(f"Error closing Elasticsearch: {e}")
    
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="A high-performance URL shortener service with FastAPI, Redis, and PostgreSQL",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc)
        }
    )


app.include_router(short_links.router)
app.include_router(redirect.router)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": "URL Shortener Service",
        "features": [
            "Smart caching with SingleFlight protection",
            "Hot shortcode pre-warming",
            "QR code generation",
            "Elasticsearch integration",
            "CSV streaming import"
        ],
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    from app.core.redis_client import redis_client
    from app.core.qr_generator import get_qr_generator
    
    es_available = False
    try:
        es_client = get_elasticsearch_client()
        es_available = es_client.is_available()
    except Exception:
        pass
    
    redis_available = False
    try:
        redis_available = redis_client.client.ping()
    except Exception:
        pass
    
    qr_available = get_qr_generator().is_available()
    
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "components": {
            "elasticsearch": "available" if es_available else "unavailable",
            "redis": "available" if redis_available else "unavailable",
            "qr_generator": "available" if qr_available else "unavailable"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
