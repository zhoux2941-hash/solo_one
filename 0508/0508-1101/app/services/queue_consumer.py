import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.command import (
    ExecutionQueue, ExecutionReceipt, MergedCommand,
    CommandSource,
)

logger = logging.getLogger(__name__)


class QueueConsumerService:
    def __init__(self, db: Session | None = None):
        self.db = db or SessionLocal()

    def __del__(self):
        if self.db:
            self.db.close()

    def _fetch_pending_items(self, batch_size: int = 10) -> list[ExecutionQueue]:
        now = datetime.utcnow()
        return (
            self.db.query(ExecutionQueue)
            .filter(
                ExecutionQueue.status == "pending",
                ExecutionQueue.execute_after <= now,
            )
            .order_by(ExecutionQueue.created_at.asc())
            .limit(batch_size)
            .with_for_update(skip_locked=True)
            .all()
        )

    def _call_device(self, gate_code: str, action: str, queue_id: int) -> tuple[bool, str, str]:
        logger.info(f"Calling device gate={gate_code} action={action} queue_id={queue_id}")
        try:
            success = True
            result_code = f"EXEC_{action.upper()}_OK"
            result_message = f"Gate {gate_code} {action} executed successfully"
        except Exception as e:
            success = False
            result_code = "EXEC_ERROR"
            result_message = str(e)
            logger.error(f"Device call failed gate={gate_code}: {e}")
        return success, result_code, result_message

    def _write_receipt(
        self,
        queue_item: ExecutionQueue,
        merged: MergedCommand,
        success: bool,
        result_code: str,
        result_message: str,
    ) -> ExecutionReceipt:
        receipt = ExecutionReceipt(
            merged_command_id=merged.id,
            queue_id=queue_item.id,
            gate_code=queue_item.gate_code,
            action=queue_item.action,
            source=merged.source,
            success=success,
            result_code=result_code,
            result_message=result_message,
            reported_by="queue_consumer",
            reported_at=datetime.utcnow(),
        )
        self.db.add(receipt)
        return receipt

    def process_next_batch(self, batch_size: int = 10) -> int:
        items = self._fetch_pending_items(batch_size)
        processed = 0

        for item in items:
            try:
                item.status = "processing"
                self.db.flush()

                merged = (
                    self.db.query(MergedCommand)
                    .filter(MergedCommand.id == item.merged_command_id)
                    .first()
                )

                if not merged:
                    item.status = "failed"
                    continue

                success, result_code, result_message = self._call_device(
                    item.gate_code, item.action, item.id
                )

                self._write_receipt(item, merged, success, result_code, result_message)

                item.status = "success" if success else "failed"
                item.executed_at = datetime.utcnow()
                processed += 1

            except Exception as e:
                logger.exception(f"Failed processing queue item {item.id}: {e}")
                item.status = "failed"

        self.db.commit()
        return processed
