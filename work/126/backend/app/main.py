from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings, ensure_directories
from .database import init_db
from .routers import pointcloud, ballistic, reports, cartridge

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_directories()
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="法庭弹道分析工具 - 用于分析犯罪现场弹道轨迹和弹壳比对",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pointcloud.router)
app.include_router(ballistic.router)
app.include_router(reports.router)
app.include_router(cartridge.router)

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
