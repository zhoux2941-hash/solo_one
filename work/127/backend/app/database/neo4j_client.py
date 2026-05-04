from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncSession
from typing import Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class Neo4jDatabase:
    _driver: Optional[AsyncDriver] = None
    
    @classmethod
    async def initialize(cls) -> None:
        if cls._driver is None:
            try:
                cls._driver = AsyncGraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                    database=settings.NEO4J_DATABASE
                )
                await cls._driver.verify_connectivity()
                logger.info("Neo4j connection established successfully")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")
                raise
    
    @classmethod
    async def close(cls) -> None:
        if cls._driver is not None:
            await cls._driver.close()
            cls._driver = None
            logger.info("Neo4j connection closed")
    
    @classmethod
    async def get_session(cls) -> AsyncSession:
        if cls._driver is None:
            await cls.initialize()
        return cls._driver.session(database=settings.NEO4J_DATABASE)


async def get_db_session():
    session = await Neo4jDatabase.get_session()
    try:
        yield session
    finally:
        await session.close()
