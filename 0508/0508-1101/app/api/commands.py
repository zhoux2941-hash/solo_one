import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.core.database import get_db
from app.models.command import (
    CommandSource, MergedCommand, ExecutionReceipt,
    GateCommand, DedupeAudit,
)
from app.schemas.command import (
    CommandIn, CommandOut, MergedCommandOut,
    ReceiptIn, ReceiptOut, DedupeAuditOut,
    SourceDedupeSummary, SourceDedupeSummaryItem,
    ReplacedDailySummary, ReplacedSummaryItem,
)
from app.services.command_merge import CommandMergeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/commands", tags=["commands"])


@router.post("/upstream", response_model=CommandOut, status_code=status.HTTP_201_CREATED)
def receive_upstream(payload: CommandIn, db: Session = Depends(get_db)):
    svc = CommandMergeService(db)
    result = svc.process_command(payload, CommandSource.UPSTREAM)
    original_ids = json.loads(result.merged.original_command_ids)
    cmd = db.query(GateCommand).filter(GateCommand.id == original_ids[-1]).first()
    return cmd


@router.post("/interval", response_model=CommandOut, status_code=status.HTTP_201_CREATED)
def receive_interval(payload: CommandIn, db: Session = Depends(get_db)):
    svc = CommandMergeService(db)
    result = svc.process_command(payload, CommandSource.INTERVAL)
    original_ids = json.loads(result.merged.original_command_ids)
    cmd = db.query(GateCommand).filter(GateCommand.id == original_ids[-1]).first()
    return cmd


@router.post("/manual", response_model=CommandOut, status_code=status.HTTP_201_CREATED)
def receive_manual(payload: CommandIn, db: Session = Depends(get_db)):
    svc = CommandMergeService(db)
    result = svc.process_command(payload, CommandSource.MANUAL)
    original_ids = json.loads(result.merged.original_command_ids)
    cmd = db.query(GateCommand).filter(GateCommand.id == original_ids[-1]).first()
    return cmd


@router.get("/merged", response_model=list[MergedCommandOut])
def list_merged(gate_code: str | None = None, active: bool | None = None,
                db: Session = Depends(get_db)):
    q = db.query(MergedCommand)
    if gate_code:
        q = q.filter(MergedCommand.gate_code == gate_code)
    if active is not None:
        q = q.filter(MergedCommand.is_active == active)
    return q.order_by(MergedCommand.created_at.desc()).all()


@router.post("/receipts", response_model=ReceiptOut, status_code=status.HTTP_201_CREATED)
def submit_receipt(payload: ReceiptIn, db: Session = Depends(get_db)):
    merged = db.query(MergedCommand).filter(
        MergedCommand.id == payload.merged_command_id
    ).first()
    if not merged:
        raise HTTPException(status_code=404, detail="merged command not found")
    receipt = ExecutionReceipt(
        merged_command_id=payload.merged_command_id,
        queue_id=payload.queue_id,
        gate_code=payload.gate_code,
        action=payload.action,
        source=payload.source,
        success=payload.success,
        result_code=payload.result_code,
        result_message=payload.result_message,
        reported_by=payload.reported_by,
        reported_at=payload.reported_at or datetime.utcnow(),
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.get("/receipts", response_model=list[ReceiptOut])
def list_receipts(gate_code: str | None = None, merged_command_id: int | None = None,
                  db: Session = Depends(get_db)):
    q = db.query(ExecutionReceipt)
    if gate_code:
        q = q.filter(ExecutionReceipt.gate_code == gate_code)
    if merged_command_id:
        q = q.filter(ExecutionReceipt.merged_command_id == merged_command_id)
    return q.order_by(ExecutionReceipt.reported_at.desc()).all()


@router.get("/dedupe-audits", response_model=list[DedupeAuditOut])
def list_dedupe_audits(
    gate_code: str | None = None,
    time_slot: str | None = None,
    source: CommandSource | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(DedupeAudit)
    if gate_code:
        q = q.filter(DedupeAudit.gate_code == gate_code)
    if time_slot:
        q = q.filter(DedupeAudit.time_slot == time_slot)
    if source:
        q = q.filter(
            (DedupeAudit.winning_source == source) | (DedupeAudit.losing_source == source)
        )
    return q.order_by(DedupeAudit.created_at.desc()).all()


@router.get("/dedupe-summary", response_model=SourceDedupeSummary)
def get_dedupe_summary(
    source: CommandSource | None = None,
    hours: int = 24,
    db: Session = Depends(get_db),
):
    period_end = datetime.utcnow()
    period_start = period_end - timedelta(hours=hours)

    audits = db.query(DedupeAudit).filter(
        DedupeAudit.created_at >= period_start,
        DedupeAudit.created_at <= period_end,
    ).all()

    if source:
        audits = [
            a for a in audits
            if a.winning_source == source or a.losing_source == source
        ]

    all_sources = [CommandSource.UPSTREAM, CommandSource.INTERVAL, CommandSource.MANUAL]
    target_sources = [source] if source else all_sources

    source_stats: dict[CommandSource, dict] = {}
    for s in target_sources:
        source_stats[s] = {
            "total_commands": 0,
            "merged_count": 0,
            "replaced_count": 0,
            "win_count": 0,
            "lose_count": 0,
            "win_actions": defaultdict(int),
            "lose_actions": defaultdict(int),
        }

    gates_affected: set[str] = set()

    for audit in audits:
        gates_affected.add(audit.gate_code)

        if audit.winning_source in source_stats:
            stats = source_stats[audit.winning_source]
            stats["win_count"] += 1
            stats["win_actions"][audit.winning_action] += 1
            stats["merged_count"] += 1
            stats["replaced_count"] += 1

        if audit.losing_source in source_stats:
            stats = source_stats[audit.losing_source]
            stats["lose_count"] += 1
            stats["lose_actions"][audit.losing_action] += 1
            stats["replaced_count"] += 1

    for s in target_sources:
        source_stats[s]["total_commands"] = (
            source_stats[s]["win_count"] + source_stats[s]["lose_count"]
        )

    summary_items: list[SourceDedupeSummaryItem] = []
    for s in target_sources:
        stats = source_stats[s]
        summary_items.append(SourceDedupeSummaryItem(
            source=s,
            total_commands=stats["total_commands"],
            merged_count=stats["merged_count"],
            replaced_count=stats["replaced_count"],
            win_count=stats["win_count"],
            lose_count=stats["lose_count"],
            win_actions=dict(stats["win_actions"]),
            lose_actions=dict(stats["lose_actions"]),
        ))

    return SourceDedupeSummary(
        summary=summary_items,
        period_start=period_start,
        period_end=period_end,
        total_audits=len(audits),
        total_gates_affected=len(gates_affected),
    )


@router.get("/replaced-summary", response_model=ReplacedDailySummary)
def get_replaced_daily_summary(
    date: str | None = None,
    db: Session = Depends(get_db),
):
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")
        period_start = target_date
        period_end = target_date + timedelta(days=1) - timedelta(seconds=1)
    else:
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=1)

    audits = db.query(DedupeAudit).filter(
        DedupeAudit.created_at >= period_start,
        DedupeAudit.created_at <= period_end,
    ).all()

    groups: dict[tuple[CommandSource, str], dict] = {}
    gate_counter: dict[str, int] = defaultdict(int)

    for audit in audits:
        key = (audit.losing_source, audit.losing_action)
        if key not in groups:
            groups[key] = {
                "count": 0,
                "sample_gate_codes": [],
                "sample_audit_ids": [],
                "winning_sources": set(),
            }
        group = groups[key]
        group["count"] += 1
        if len(group["sample_gate_codes"]) < 5 and audit.gate_code not in group["sample_gate_codes"]:
            group["sample_gate_codes"].append(audit.gate_code)
        if len(group["sample_audit_ids"]) < 5:
            group["sample_audit_ids"].append(audit.id)
        group["winning_sources"].add(audit.winning_source)

        gate_counter[audit.gate_code] += 1

    by_source_action: list[ReplacedSummaryItem] = []
    for (losing_source, losing_action), data in sorted(
        groups.items(), key=lambda x: x[1]["count"], reverse=True
    ):
        by_source_action.append(ReplacedSummaryItem(
            losing_source=losing_source,
            losing_action=losing_action,
            count=data["count"],
            sample_gate_codes=data["sample_gate_codes"],
            sample_audit_ids=data["sample_audit_ids"],
            winning_sources=list(data["winning_sources"]),
        ))

    most_replaced_gate = None
    most_replaced_gate_count = 0
    if gate_counter:
        most_replaced_gate = max(gate_counter, key=gate_counter.get)
        most_replaced_gate_count = gate_counter[most_replaced_gate]

    total_replaced = len(audits)

    return ReplacedDailySummary(
        date=period_start.strftime("%Y-%m-%d"),
        total_replaced=total_replaced,
        by_source_action=by_source_action,
        most_replaced_gate=most_replaced_gate,
        most_replaced_gate_count=most_replaced_gate_count,
        period_start=period_start,
        period_end=period_end,
    )
