from datetime import datetime
from pydantic import BaseModel, Field
from app.models.command import CommandSource


class CommandIn(BaseModel):
    gate_code: str = Field(..., max_length=32)
    action: str = Field(..., pattern=r"^(open|close)$")
    time_slot: str = Field(..., max_length=32)
    plan_version: int = Field(default=1, ge=1)
    raw_payload: str | None = None
    requested_at: datetime | None = None


class CommandOut(BaseModel):
    id: int
    gate_code: str
    action: str
    source: CommandSource
    time_slot: str
    plan_version: int
    requested_at: datetime
    is_merged: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MergedCommandOut(BaseModel):
    id: int
    gate_code: str
    time_slot: str
    action: str
    source: CommandSource
    priority: int
    plan_version: int
    is_active: bool

    class Config:
        from_attributes = True


class ReceiptIn(BaseModel):
    merged_command_id: int
    queue_id: int
    gate_code: str
    action: str
    source: CommandSource
    success: bool
    result_code: str | None = None
    result_message: str | None = None
    reported_by: str
    reported_at: datetime | None = None


class ReceiptOut(BaseModel):
    id: int
    merged_command_id: int
    queue_id: int
    gate_code: str
    action: str
    source: CommandSource
    success: bool
    result_code: str | None
    reported_at: datetime

    class Config:
        from_attributes = True


class DedupeAuditOut(BaseModel):
    id: int
    gate_code: str
    time_slot: str
    winning_source: CommandSource
    winning_action: str
    losing_source: CommandSource
    losing_action: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


class SourceDedupeSummaryItem(BaseModel):
    source: CommandSource
    total_commands: int
    merged_count: int
    replaced_count: int
    win_count: int
    lose_count: int
    win_actions: dict[str, int]
    lose_actions: dict[str, int]


class SourceDedupeSummary(BaseModel):
    summary: list[SourceDedupeSummaryItem]
    period_start: datetime
    period_end: datetime
    total_audits: int
    total_gates_affected: int


class ReplacedSummaryItem(BaseModel):
    losing_source: CommandSource
    losing_action: str
    count: int
    sample_gate_codes: list[str]
    sample_audit_ids: list[int]
    winning_sources: list[CommandSource]


class ReplacedDailySummary(BaseModel):
    date: str
    total_replaced: int
    by_source_action: list[ReplacedSummaryItem]
    most_replaced_gate: str | None = None
    most_replaced_gate_count: int = 0
    period_start: datetime
    period_end: datetime
