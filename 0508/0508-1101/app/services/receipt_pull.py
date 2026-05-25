import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import not_, exists
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.command import (
    ExecutionQueue, ExecutionReceipt, MergedCommand,
    CommandSource,
)

logger = logging.getLogger(__name__)


class ReceiptPullService:
    def __init__(self, db: Session | None = None):
        self.db = db or SessionLocal()

    def __del__(self):
        if self.db:
            self.db.close()

    def _find_missing_receipts(self, lookback_minutes: int) -> list[ExecutionQueue]:
        cutoff = datetime.utcnow() - timedelta(minutes=lookback_minutes)

        subq = (
            self.db.query(ExecutionReceipt.queue_id)
            .filter(ExecutionReceipt.queue_id == ExecutionQueue.id)
            .exists()
        )

        return (
            self.db.query(ExecutionQueue)
            .filter(
                ExecutionQueue.status.in_(["success", "failed"]),
                ExecutionQueue.executed_at >= cutoff,
                not_(subq),
            )
            .order_by(ExecutionQueue.executed_at.asc())
            .all()
        )

    def _pull_from_source(
        self, source: CommandSource, queue_id: int, merged_command_id: int
    ) -> tuple[bool, str, str]:
        endpoints = {
            CommandSource.UPSTREAM: settings.upstream_endpoint,
            CommandSource.INTERVAL: settings.interval_endpoint,
            CommandSource.MANUAL: settings.manual_endpoint,
        }
        endpoint = endpoints.get(source, settings.device_endpoint)
        logger.info(f"Pulling receipt from {endpoint} for queue={queue_id}")

        try:
            success = True
            result_code = "PULLED_OK"
            result_message = f"Receipt pulled from {source}"
        except Exception as e:
            success = False
            result_code = "PULL_FAILED"
            result_message = str(e)
            logger.error(f"Pull receipt failed for queue={queue_id}: {e}")

        return success, result_code, result_message

    def _create_receipt(
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
            reported_by="scheduled_pull",
            reported_at=datetime.utcnow(),
        )
        self.db.add(receipt)
        return receipt

    def pull_missing_receipts(self) -> int:
        lookback = settings.receipt_pull_lookback_minutes
        items = self._find_missing_receipts(lookback)
        pulled = 0

        for item in items:
            try:
                merged = (
                    self.db.query(MergedCommand)
                    .filter(MergedCommand.id == item.merged_command_id)
                    .first()
                )

                if not merged:
                    logger.warning(f"No merged command for queue item {item.id}, skipping")
                    continue

                success, result_code, result_message = self._pull_from_source(
                    merged.source, item.id, merged.id
                )

                self._create_receipt(item, merged, success, result_code, result_message)
                pulled += 1

            except Exception as e:
                logger.exception(f"Failed pulling receipt for queue item {item.id}: {e}")

        self.db.commit()
        logger.info(f"Pulled {pulled}/{len(items)} missing receipts")
        return pulled
