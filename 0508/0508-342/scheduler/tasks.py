from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from storage.repository import AsyncTaskLogRepository, AlertRepository
from storage.models import AsyncTaskLog
import logging

logger = logging.getLogger(__name__)


class AsyncTasks:
    def __init__(self, db: Session):
        self.db = db
        self._merging_service = None
        self._snapshot_service = None

    @property
    def merging_service(self):
        if self._merging_service is None:
            from merging_service.service import MergingService
            self._merging_service = MergingService(self.db)
        return self._merging_service

    @property
    def snapshot_service(self):
        if self._snapshot_service is None:
            from snapshot_export.service import SnapshotExportService
            self._snapshot_service = SnapshotExportService(self.db)
        return self._snapshot_service

    def _create_task_log(self, task_name: str, task_type: str) -> int:
        task_log = AsyncTaskLog(
            task_name=task_name,
            task_type=task_type,
            status="running"
        )
        saved_log = AsyncTaskLogRepository.create(self.db, task_log)
        return saved_log.id

    def _complete_task_log(
        self,
        task_id: int,
        success: bool,
        records_processed: int = 0,
        error_message: str = None
    ):
        status = "completed" if success else "failed"
        AsyncTaskLogRepository.update_status(
            self.db, task_id, status, records_processed, error_message
        )

    def process_incoming_data_task(self) -> bool:
        task_id = self._create_task_log("process_incoming_data", "merging")
        try:
            result = self.merging_service.process_incoming_data()
            self._complete_task_log(task_id, True, result.processed_count)
            logger.info(f"Process task completed: {result.processed_count} records")
            return True
        except Exception as e:
            logger.error(f"Process task failed: {str(e)}")
            self._complete_task_log(task_id, False, 0, str(e))
            return False

    def fill_late_data_task(self, hours_back: int = 24) -> bool:
        task_id = self._create_task_log("fill_late_data", "backfill")
        try:
            count = self.merging_service.fill_late_data(hours_back)
            self._complete_task_log(task_id, True, count)
            logger.info(f"Late data task completed: {count} records processed")
            return True
        except Exception as e:
            logger.error(f"Late data task failed: {str(e)}")
            self._complete_task_log(task_id, False, 0, str(e))
            return False

    def generate_snapshots_task(self) -> bool:
        task_id = self._create_task_log("generate_snapshots", "snapshot")
        try:
            pending_alerts = AlertRepository.get_pending_review(self.db)
            count = 0

            for alert in pending_alerts:
                success, _ = self.snapshot_service.generate_alert_snapshot(alert.id)
                if success:
                    count += 1

            self._complete_task_log(task_id, True, count)
            logger.info(f"Snapshot task completed: {count} snapshots generated")
            return True
        except Exception as e:
            logger.error(f"Snapshot task failed: {str(e)}")
            self._complete_task_log(task_id, False, 0, str(e))
            return False

    def cleanup_old_snapshots_task(self, retention_days: int = 30) -> bool:
        task_id = self._create_task_log("cleanup_snapshots", "maintenance")
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            from storage.repository import AlertSnapshotRepository
            AlertSnapshotRepository.cleanup_old_snapshots(self.db, cutoff_date)
            self._complete_task_log(task_id, True)
            logger.info(f"Cleanup task completed: removed snapshots before {cutoff_date}")
            return True
        except Exception as e:
            logger.error(f"Cleanup task failed: {str(e)}")
            self._complete_task_log(task_id, False, 0, str(e))
            return False

    def recalculate_segment_task(self, pipe_segment_id: str) -> bool:
        task_id = self._create_task_log(
            f"recalculate_segment_{pipe_segment_id}", "recalculation"
        )
        try:
            updated, archived = self.merging_service.recalculate_by_pipe_segment(pipe_segment_id)
            self._complete_task_log(task_id, True, updated + archived)
            logger.info(
                f"Recalculation task completed for {pipe_segment_id}: "
                f"{updated} updated, {archived} archived"
            )
            return True
        except Exception as e:
            logger.error(f"Recalculation task failed: {str(e)}")
            self._complete_task_log(task_id, False, 0, str(e))
            return False
