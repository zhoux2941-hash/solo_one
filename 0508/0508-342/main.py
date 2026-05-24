from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
from storage.database import init_db
from scheduler.manager import get_scheduler
from api.ingestion import router as ingestion_router
from api.alerts import router as alerts_router
from api.admin import router as admin_router
from config import get_settings

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized")

    logger.info("Starting task scheduler...")
    scheduler = get_scheduler()
    scheduler.start()

    yield

    logger.info("Stopping task scheduler...")
    scheduler.stop()
    logger.info("Shutdown complete")


app = FastAPI(
    title="市政巡检渗漏告警聚合服务",
    description="统一聚合湿度探头、视频抓拍和人工巡检数据的渗漏告警系统",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(ingestion_router)
app.include_router(alerts_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "service": "市政巡检渗漏告警聚合服务",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "ingestion": "/ingest/*",
            "alerts": "/alerts/*",
            "admin": "/admin/*",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
