import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.command import (
    GateCommand, MergedCommand, ExecutionQueue, DedupeAudit,
    CommandSource, SOURCE_PRIORITY,
)
from app.schemas.command import CommandIn

logger = logging.getLogger(__name__)

DEDUPE_WINDOW_SECONDS = 300


class MergeResult:
    def __init__(self, merged: MergedCommand, is_new: bool, replaced: MergedCommand | None = None):
        self.merged = merged
        self.is_new = is_new
        self.replaced = replaced


class CommandMergeService:
    def __init__(self, db: Session):
        self.db = db

    def _build_time_window(self, base_time: datetime) -> tuple[datetime, datetime]:
        window_start = base_time - timedelta(seconds=DEDUPE_WINDOW_SECONDS)
        window_end = base_time + timedelta(seconds=DEDUPE_WINDOW_SECONDS)
        return window_start, window_end

    def _find_existing_merged(
        self, gate_code: str, time_slot: str, window_start: datetime
    ) -> MergedCommand | None:
        return (
            self.db.query(MergedCommand)
            .filter(
                MergedCommand.gate_code == gate_code,
                MergedCommand.time_slot == time_slot,
                MergedCommand.is_active == True,
                MergedCommand.created_at >= window_start,
            )
            .order_by(MergedCommand.priority.desc(), MergedCommand.created_at.desc())
            .first()
        )

    def _find_pending_queue_item(
        self, merged_command_id: int
    ) -> ExecutionQueue | None:
        return (
            self.db.query(ExecutionQueue)
            .filter(
                ExecutionQueue.merged_command_id == merged_command_id,
                ExecutionQueue.status == "pending",
            )
            .first()
        )

    def _record_audit(
        self,
        gate_code: str,
        time_slot: str,
        winner: GateCommand,
        loser: GateCommand,
        reason: str,
    ):
        audit = DedupeAudit(
            gate_code=gate_code,
            time_slot=time_slot,
            winning_source=winner.source,
            winning_action=winner.action,
            winning_command_id=winner.id,
            losing_source=loser.source,
            losing_action=loser.action,
            losing_command_id=loser.id,
            reason=reason,
            window_seconds=DEDUPE_WINDOW_SECONDS,
        )
        self.db.add(audit)

    def _create_merged_command(
        self, command: GateCommand, original_ids: list[int]
    ) -> MergedCommand:
        merged = MergedCommand(
            gate_code=command.gate_code,
            time_slot=command.time_slot,
            action=command.action,
            source=command.source,
            priority=SOURCE_PRIORITY[command.source],
            plan_version=command.plan_version,
            original_command_ids=json.dumps(original_ids),
            is_active=True,
        )
        self.db.add(merged)
        self.db.flush()
        return merged

    def _update_queue_item(
        self, queue_item: ExecutionQueue, new_merged: MergedCommand
    ) -> ExecutionQueue:
        queue_item.merged_command_id = new_merged.id
        queue_item.action = new_merged.action
        queue_item.gate_code = new_merged.gate_code
        queue_item.execute_after = datetime.utcnow()
        return queue_item

    def _create_queue_item(self, merged: MergedCommand) -> ExecutionQueue:
        queue_item = ExecutionQueue(
            merged_command_id=merged.id,
            gate_code=merged.gate_code,
            action=merged.action,
            status="pending",
            execute_after=datetime.utcnow(),
        )
        self.db.add(queue_item)
        return queue_item

    def process_command(self, cmd_in: CommandIn, source: CommandSource) -> MergeResult:
        requested_at = cmd_in.requested_at or datetime.utcnow()
        raw_payload = cmd_in.raw_payload or json.dumps(cmd_in.model_dump(), default=str)

        new_command = GateCommand(
            gate_code=cmd_in.gate_code,
            action=cmd_in.action,
            source=source,
            time_slot=cmd_in.time_slot,
            plan_version=cmd_in.plan_version,
            raw_payload=raw_payload,
            requested_at=requested_at,
            is_merged=False,
        )
        self.db.add(new_command)
        self.db.flush()

        window_start, _ = self._build_time_window(requested_at)
        existing_merged = self._find_existing_merged(
            cmd_in.gate_code, cmd_in.time_slot, window_start
        )

        if not existing_merged:
            merged = self._create_merged_command(new_command, [new_command.id])
            self._create_queue_item(merged)
            new_command.is_merged = True
            self.db.commit()
            self.db.refresh(merged)
            return MergeResult(merged=merged, is_new=True)

        existing_original_ids = json.loads(existing_merged.original_command_ids)
        existing_command = (
            self.db.query(GateCommand)
            .filter(GateCommand.id == existing_original_ids[-1])
            .first()
        )

        if not existing_command:
            merged = self._create_merged_command(new_command, [new_command.id])
            self._create_queue_item(merged)
            new_command.is_merged = True
            self.db.commit()
            self.db.refresh(merged)
            return MergeResult(merged=merged, is_new=True)

        new_priority = SOURCE_PRIORITY[source]
        existing_priority = existing_merged.priority

        if new_priority < existing_priority:
            reason = f"low_priority_{source}_superseded_by_{existing_merged.source}"
            self._record_audit(
                cmd_in.gate_code, cmd_in.time_slot, existing_command, new_command, reason
            )
            new_command.is_merged = True
            existing_merged.original_command_ids = json.dumps(
                existing_original_ids + [new_command.id]
            )
            self.db.commit()
            self.db.refresh(existing_merged)
            return MergeResult(merged=existing_merged, is_new=False)

        if new_priority == existing_priority:
            if new_command.action == existing_merged.action:
                reason = f"same_priority_same_action_{source}_within_{DEDUPE_WINDOW_SECONDS}s"
                self._record_audit(
                    cmd_in.gate_code, cmd_in.time_slot, existing_command, new_command, reason
                )
                new_command.is_merged = True
                existing_merged.original_command_ids = json.dumps(
                    existing_original_ids + [new_command.id]
                )
                if new_command.plan_version > existing_merged.plan_version:
                    existing_merged.plan_version = new_command.plan_version
                self.db.commit()
                self.db.refresh(existing_merged)
                return MergeResult(merged=existing_merged, is_new=False)
            else:
                if new_command.plan_version < existing_merged.plan_version:
                    reason = f"same_priority_old_version_{source}_superseded"
                    self._record_audit(
                        cmd_in.gate_code, cmd_in.time_slot, existing_command, new_command, reason
                    )
                    new_command.is_merged = True
                    existing_merged.original_command_ids = json.dumps(
                        existing_original_ids + [new_command.id]
                    )
                    self.db.commit()
                    self.db.refresh(existing_merged)
                    return MergeResult(merged=existing_merged, is_new=False)

        reason = (
            f"high_priority_{source}_replaces_{existing_merged.source}"
            if new_priority > existing_priority
            else f"same_priority_new_version_{source}_replaces_{existing_merged.source}"
        )
        self._record_audit(
            cmd_in.gate_code, cmd_in.time_slot, new_command, existing_command, reason
        )

        existing_merged.is_active = False

        new_original_ids = existing_original_ids + [new_command.id]
        new_merged = self._create_merged_command(new_command, new_original_ids)

        pending_queue = self._find_pending_queue_item(existing_merged.id)
        if pending_queue:
            self._update_queue_item(pending_queue, new_merged)
        else:
            self._create_queue_item(new_merged)

        new_command.is_merged = True
        existing_command.is_merged = True

        self.db.commit()
        self.db.refresh(new_merged)

        return MergeResult(merged=new_merged, is_new=True, replaced=existing_merged)
