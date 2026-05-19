from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import enum

from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class PolicyType(str, enum.Enum):
    """策略类型"""
    WHITELIST = "whitelist"
    BLACKLIST = "blacklist"


class DeviceModel(Base):
    """设备型号定义 - 基于vendor_id, product_id和描述符"""
    __tablename__ = "device_models"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, unique=True, index=True)
    model_name = Column(String, index=True)
    vendor_id = Column(Integer, index=True)
    product_id = Column(Integer, index=True)
    vendor_name_pattern = Column(String)
    product_name_pattern = Column(String)
    device_type = Column(String)
    category = Column(String)
    description = Column(Text)
    is_authorized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    devices = relationship("USBDevice", back_populates="model_info")


class ModelPolicy(Base):
    """型号访问策略"""
    __tablename__ = "model_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_type = Column(Enum(PolicyType), default=PolicyType.BLACKLIST)
    model_id = Column(String, ForeignKey("device_models.model_id"), nullable=True)
    vendor_id = Column(Integer, nullable=True)
    product_id = Column(Integer, nullable=True)
    device_type = Column(String, nullable=True)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class USBDevice(Base):
    __tablename__ = "usb_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    vendor_id = Column(Integer)
    product_id = Column(Integer)
    manufacturer = Column(String)
    product = Column(String)
    serial_number = Column(String)
    device_type = Column(String)
    model_id = Column(String, ForeignKey("device_models.model_id"), nullable=True)
    fingerprint_vector = Column(Text)
    is_blacklisted = Column(Boolean, default=False)
    is_model_authorized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    model_info = relationship("DeviceModel", back_populates="devices")

    def set_fingerprint_vector(self, vector):
        self.fingerprint_vector = json.dumps(vector)

    def get_fingerprint_vector(self):
        return json.loads(self.fingerprint_vector) if self.fingerprint_vector else []


class DeviceHistory(Base):
    __tablename__ = "device_history"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
