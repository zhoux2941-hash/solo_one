from sqlalchemy.orm import Session
from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta
from config import get_settings
from merging_service.time_window import TimeWindowMerger
from merging_service.schemas import MergeSummary
from storage.repository import AlertRepository, PipeSegmentRepository, RecalculationHistoryRepository
from storage.models import RecalculationHistory
import logging

logger = logging.getLogger(__name__)

settings = get_settings()


class MergingService:
    def __init__(self, db: Session):
        self.db = db
        self.merger = TimeWindowMerger(db, settings.time_window_minutes)

    def process_incoming_data(self) -> MergeSummary:
        processed, new_alerts, updated_alerts = self.merger.process_unprocessed_data()
        return MergeSummary(
            processed_count=processed,
            new_alerts=new_alerts,
            updated_alerts=updated_alerts,
            skipped_records=0,
            timestamp=datetime.now()
        )

    def fill_late_data(self, hours_back: int = 24) -> int:
        cutoff_time = datetime.now() - timedelta(hours=hours_back)
        return self.merger.process_late_data(cutoff_time)

    def recalculate_by_pipe_segment(self, pipe_segment_id: str) -> Tuple[int, int]:
        return self.merger.recalculate_pipe_segment(pipe_segment_id)

    def recalculate_all_segments(self) -> Tuple[int, int, int]:
        segments = PipeSegmentRepository.get_all_active(self.db)
        total_updated = 0
        total_archived = 0

        for segment in segments:
            updated, archived = self.recalculate_by_pipe_segment(segment.segment_id)
            total_updated += updated
            total_archived += archived
            PipeSegmentRepository.update_recalculation_time(self.db, segment.segment_id)

        return len(segments), total_updated, total_archived

    def get_active_alerts_summary(self):
        alerts = AlertRepository.get_pending_review(self.db)
        summary = {
            "total_pending": len(alerts),
            "by_level": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "info": 0
            }
        }
        for alert in alerts:
            level = alert.alert_level.lower()
            if level in summary["by_level"]:
                summary["by_level"][level] += 1
        return summary

    def recalculate_by_date_range(
        self,
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime,
        executed_by: str = None
    ) -> Tuple[int, int, int]:
        return self.merger.recalculate_by_date_range(
            pipe_segment_id, start_time, end_time, executed_by
        )

    def recalculate_all_by_date_range(
        self,
        start_time: datetime,
        end_time: datetime,
        executed_by: str = None
    ) -> Dict[str, Tuple[int, int, int]]:
        return self.merger.recalculate_all_segments_by_date_range(
            start_time, end_time, executed_by
        )

    def get_last_recalculation(self, pipe_segment_id: str = None) -> Optional[Dict]:
        if pipe_segment_id:
            history = RecalculationHistoryRepository.get_last_by_segment(
                self.db, pipe_segment_id
            )
        else:
            histories = RecalculationHistoryRepository.get_last_all(self.db, limit=1)
            history = histories[0] if histories else None

        if not history:
            return None

        return {
            "id": history.id,
            "pipe_segment_id": history.pipe_segment_id,
            "scope_type": history.scope_type,
            "start_time": history.start_time,
            "end_time": history.end_time,
            "parameters": history.parameters,
            "alerts_updated": history.alerts_updated,
            "alerts_archived": history.alerts_archived,
            "alerts_merged": history.alerts_merged,
            "executed_by": history.executed_by,
            "status": history.status,
            "created_at": history.created_at,
            "completed_at": history.completed_at
        }

    def get_recalculation_history(self, limit: int = 10) -> List[Dict]:
        histories = RecalculationHistoryRepository.get_last_all(self.db, limit)
        return [
            {
                "id": h.id,
                "pipe_segment_id": h.pipe_segment_id,
                "scope_type": h.scope_type,
                "start_time": h.start_time,
                "end_time": h.end_time,
                "alerts_updated": h.alerts_updated,
                "alerts_archived": h.alerts_archived,
                "alerts_merged": h.alerts_merged,
                "status": h.status,
                "created_at": h.created_at
            }
            for h in histories
        ]
