import enum
from datetime import datetime, timedelta
from sqlalchemy import String, Integer, DateTime, Boolean, Text, Index, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class CommandSource(str, enum.Enum):
    UPSTREAM = "upstream"
    INTERVAL = "interval"
    MANUAL = "manual"


SOURCE_PRIORITY = {
    CommandSource.UPSTREAM: 1,
    CommandSource.INTERVAL: 2,
    CommandSource.MANUAL: 3,
}


class GateCommand(Base):
    __tablename__ = "gate_commands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gate_code: Mapped[str] = mapped_column(String(32), index=True)
    action: Mapped[str] = mapped_column(String(16))
    source: Mapped[CommandSource] = mapped_column(String(32))
    time_slot: Mapped[str] = mapped_column(String(32), index=True)
    plan_version: Mapped[int] = mapped_column(Integer, default=1)
    raw_payload: Mapped[str] = mapped_column(Text)
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    is_merged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    __table_args__ = (
        Index("idx_gate_slot_source", "gate_code", "time_slot", "source"),
    )


class MergedCommand(Base):
    __tablename__ = "merged_commands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gate_code: Mapped[str] = mapped_column(String(32), index=True)
    time_slot: Mapped[str] = mapped_column(String(32), index=True)
    action: Mapped[str] = mapped_column(String(16))
    source: Mapped[CommandSource] = mapped_column(String(32))
    priority: Mapped[int] = mapped_column(Integer)
    plan_version: Mapped[int] = mapped_column(Integer)
    original_command_ids: Mapped[str] = mapped_column(Text)
    queued_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    __table_args__ = (
        Index("idx_gate_slot_active", "gate_code", "time_slot", "is_active"),
    )


class ExecutionQueue(Base):
    __tablename__ = "execution_queue"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    merged_command_id: Mapped[int] = mapped_column(Integer, index=True)
    gate_code: Mapped[str] = mapped_column(String(32), index=True)
    action: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    execute_after: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    executed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


class ExecutionReceipt(Base):
    __tablename__ = "execution_receipts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    merged_command_id: Mapped[int] = mapped_column(Integer, index=True)
    queue_id: Mapped[int] = mapped_column(Integer, index=True)
    gate_code: Mapped[str] = mapped_column(String(32), index=True)
    action: Mapped[str] = mapped_column(String(16))
    source: Mapped[CommandSource] = mapped_column(String(32))
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    result_code: Mapped[str] = mapped_column(String(64), nullable=True)
    result_message: Mapped[str] = mapped_column(Text, nullable=True)
    reported_by: Mapped[str] = mapped_column(String(32))
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


class DedupeAudit(Base):
    __tablename__ = "dedupe_audits"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gate_code: Mapped[str] = mapped_column(String(32), index=True)
    time_slot: Mapped[str] = mapped_column(String(32), index=True)
    winning_source: Mapped[CommandSource] = mapped_column(String(32))
    winning_action: Mapped[str] = mapped_column(String(16))
    winning_command_id: Mapped[int] = mapped_column(Integer)
    losing_source: Mapped[CommandSource] = mapped_column(String(32))
    losing_action: Mapped[str] = mapped_column(String(16))
    losing_command_id: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(128))
    window_seconds: Mapped[int] = mapped_column(Integer, default=300)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
