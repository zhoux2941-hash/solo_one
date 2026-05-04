from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.database.neo4j_client import Neo4jDatabase
from app.routers import supply_chain, simulations, import_export, optimization

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Supply Chain Risk Analysis API...")
    await Neo4jDatabase.initialize()
    yield
    logger.info("Shutting down Supply Chain Risk Analysis API...")
    await Neo4jDatabase.close()


app = FastAPI(
    title="Supply Chain Risk Analysis API",
    description="API for analyzing supply chain risks using graph theory and Monte Carlo simulations",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(supply_chain.router, prefix="/api/v1")
app.include_router(simulations.router, prefix="/api/v1")
app.include_router(import_export.router, prefix="/api/v1")
app.include_router(optimization.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Supply Chain Risk Analysis API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
