import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine, Base
from app.core.scheduler import start_scheduler, stop_scheduler
from app.api.commands import router as commands_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="河道闸门联控服务",
    description="接收上游调度、区间补发和人工纠正三类开闭指令，统一合并去重后下发执行",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(commands_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "gate-control"}


@app.get("/")
async def root():
    return {
        "service": "河道闸门联控服务",
        "version": "1.0.0",
        "endpoints": {
            "upstream": "/api/commands/upstream",
            "interval": "/api/commands/interval",
            "manual": "/api/commands/manual",
            "merged": "/api/commands/merged",
            "receipts": "/api/commands/receipts",
            "dedupe-audits": "/api/commands/dedupe-audits",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
