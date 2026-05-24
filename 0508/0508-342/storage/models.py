from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from storage.database import Base
from datetime import datetime


class RawData(Base):
    __tablename__ = "raw_data"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(50), index=True)
    source_id = Column(String(100), index=True)
    pipe_segment_id = Column(String(100), index=True)
    location = Column(String(255))
    data_payload = Column(JSON)
    timestamp = Column(DateTime, index=True)
    received_at = Column(DateTime, default=func.now())
    is_processed = Column(Boolean, default=False)
    belongs_to_alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)

    alert = relationship("Alert", back_populates="raw_data")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_key = Column(String(100), unique=True, index=True)
    pipe_segment_id = Column(String(100), index=True)
    location = Column(String(255))
    alert_level = Column(String(20), index=True)
    alert_score = Column(Float)
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending_review")
    humidity_count = Column(Integer, default=0)
    video_count = Column(Integer, default=0)
    manual_count = Column(Integer, default=0)
    evidence_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)

    raw_data = relationship("RawData", back_populates="alert")
    snapshots = relationship("AlertSnapshot", back_populates="alert")


class AlertSnapshot(Base):
    __tablename__ = "alert_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    snapshot_type = Column(String(50))
    summary = Column(Text)
    evidence_summary = Column(JSON)
    generated_at = Column(DateTime, default=func.now())
    export_format = Column(String(20), default="json")

    alert = relationship("Alert", back_populates="snapshots")


class AsyncTaskLog(Base):
    __tablename__ = "async_task_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(100), index=True)
    task_type = Column(String(50))
    status = Column(String(20))
    records_processed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)


class PipeSegment(Base):
    __tablename__ = "pipe_segments"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(String(100), unique=True, index=True)
    name = Column(String(255))
    description = Column(Text, nullable=True)
    location = Column(String(255))
    is_active = Column(Boolean, default=True)
    last_recalculated_at = Column(DateTime, nullable=True)


class RecalculationHistory(Base):
    __tablename__ = "recalculation_history"

    id = Column(Integer, primary_key=True, index=True)
    pipe_segment_id = Column(String(100), index=True, nullable=True)
    scope_type = Column(String(20), index=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    parameters = Column(JSON)
    alerts_updated = Column(Integer, default=0)
    alerts_archived = Column(Integer, default=0)
    alerts_merged = Column(Integer, default=0)
    executed_by = Column(String(100), nullable=True)
    status = Column(String(20), default="completed")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
