from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Index, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
from config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ShortLink(Base):
    __tablename__ = "short_links"
    
    id = Column(Integer, primary_key=True, index=True)
    short_code = Column(String(50), unique=True, index=True, nullable=False)
    original_url = Column(Text, nullable=False)
    custom_short_code = Column(String(50), unique=True, index=True, nullable=True)
    
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    total_clicks = Column(Integer, default=0)
    is_active = Column(String(10), default="active")
    
    clicks = relationship("Click", back_populates="short_link", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_short_code_active', 'short_code', 'is_active'),
        Index('idx_expires_at', 'expires_at'),
    )
    
    @property
    def is_expired(self) -> bool:
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def display_short_code(self) -> str:
        return self.custom_short_code or self.short_code


class Click(Base):
    __tablename__ = "clicks"
    
    id = Column(Integer, primary_key=True, index=True)
    short_link_id = Column(Integer, ForeignKey("short_links.id"), nullable=False, index=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    referer = Column(Text, nullable=True)
    
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    timezone = Column(String(100), nullable=True)
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    click_date = Column(Date, default=datetime.utcnow().date, index=True)
    
    short_link = relationship("ShortLink", back_populates="clicks")
    
    __table_args__ = (
        Index('idx_click_date_time', 'click_date', 'created_at'),
        Index('idx_short_link_date', 'short_link_id', 'click_date'),
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
