from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from storage.models import RawData, Alert, AlertSnapshot, AsyncTaskLog, PipeSegment, RecalculationHistory
from storage.database import SessionLocal


class RawDataRepository:
    @staticmethod
    def create(db: Session, raw_data: RawData) -> RawData:
        db.add(raw_data)
        db.commit()
        db.refresh(raw_data)
        return raw_data

    @staticmethod
    def get_unprocessed(db: Session, limit: int = 100) -> List[RawData]:
        return db.query(RawData).filter(RawData.is_processed == False).limit(limit).all()

    @staticmethod
    def mark_as_processed(db: Session, raw_data_id: int, alert_id: Optional[int] = None):
        raw_data = db.query(RawData).filter(RawData.id == raw_data_id).first()
        if raw_data:
            raw_data.is_processed = True
            if alert_id:
                raw_data.belongs_to_alert_id = alert_id
            db.commit()

    @staticmethod
    def get_by_time_window(
        db: Session,
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[RawData]:
        return db.query(RawData).filter(
            and_(
                RawData.pipe_segment_id == pipe_segment_id,
                RawData.timestamp >= start_time,
                RawData.timestamp <= end_time
            )
        ).all()

    @staticmethod
    def get_late_arriving_data(
        db: Session,
        cutoff_time: datetime
    ) -> List[RawData]:
        return db.query(RawData).filter(
            and_(
                RawData.received_at > cutoff_time,
                RawData.timestamp <= cutoff_time
            )
        ).all()

    @staticmethod
    def get_by_alert_id(db: Session, alert_id: int) -> List[RawData]:
        return db.query(RawData).filter(RawData.belongs_to_alert_id == alert_id).all()


class AlertRepository:
    @staticmethod
    def create(db: Session, alert: Alert) -> Alert:
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def update(db: Session, alert: Alert) -> Alert:
        alert.updated_at = func.now()
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def get_by_key(db: Session, alert_key: str) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.alert_key == alert_key).first()

    @staticmethod
    def get_pending_review(db: Session) -> List[Alert]:
        return db.query(Alert).filter(Alert.status == "pending_review").all()

    @staticmethod
    def get_by_pipe_segment(db: Session, pipe_segment_id: str) -> List[Alert]:
        return db.query(Alert).filter(Alert.pipe_segment_id == pipe_segment_id).all()

    @staticmethod
    def get_active_alerts(db: Session, time_window: timedelta) -> List[Alert]:
        cutoff_time = datetime.now() - time_window
        return db.query(Alert).filter(
            and_(
                Alert.is_archived == False,
                or_(Alert.end_time == None, Alert.end_time >= cutoff_time)
            )
        ).all()

    @staticmethod
    def get_by_id(db: Session, alert_id: int) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.id == alert_id).first()


class AlertSnapshotRepository:
    @staticmethod
    def create(db: Session, snapshot: AlertSnapshot) -> AlertSnapshot:
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot

    @staticmethod
    def get_by_alert_id(db: Session, alert_id: int) -> List[AlertSnapshot]:
        return db.query(AlertSnapshot).filter(AlertSnapshot.alert_id == alert_id).all()

    @staticmethod
    def cleanup_old_snapshots(db: Session, cutoff_date: datetime):
        db.query(AlertSnapshot).filter(AlertSnapshot.generated_at < cutoff_date).delete()
        db.commit()


class AsyncTaskLogRepository:
    @staticmethod
    def create(db: Session, task_log: AsyncTaskLog) -> AsyncTaskLog:
        db.add(task_log)
        db.commit()
        db.refresh(task_log)
        return task_log

    @staticmethod
    def update_status(
        db: Session,
        task_id: int,
        status: str,
        records_processed: int = 0,
        error_message: str = None
    ):
        task_log = db.query(AsyncTaskLog).filter(AsyncTaskLog.id == task_id).first()
        if task_log:
            task_log.status = status
            task_log.records_processed = records_processed
            task_log.error_message = error_message
            task_log.completed_at = func.now()
            db.commit()


class PipeSegmentRepository:
    @staticmethod
    def create(db: Session, segment: PipeSegment) -> PipeSegment:
        db.add(segment)
        db.commit()
        db.refresh(segment)
        return segment

    @staticmethod
    def get_all_active(db: Session) -> List[PipeSegment]:
        return db.query(PipeSegment).filter(PipeSegment.is_active == True).all()

    @staticmethod
    def get_by_id(db: Session, segment_id: str) -> Optional[PipeSegment]:
        return db.query(PipeSegment).filter(PipeSegment.segment_id == segment_id).first()

    @staticmethod
    def update_recalculation_time(db: Session, segment_id: str):
        segment = db.query(PipeSegment).filter(PipeSegment.segment_id == segment_id).first()
        if segment:
            segment.last_recalculated_at = func.now()
            db.commit()


class RecalculationHistoryRepository:
    @staticmethod
    def create(db: Session, history: RecalculationHistory) -> RecalculationHistory:
        db.add(history)
        db.commit()
        db.refresh(history)
        return history

    @staticmethod
    def update(db: Session, history: RecalculationHistory) -> RecalculationHistory:
        history.completed_at = func.now()
        db.commit()
        db.refresh(history)
        return history

    @staticmethod
    def get_last_by_segment(db: Session, pipe_segment_id: str) -> Optional[RecalculationHistory]:
        return db.query(RecalculationHistory).filter(
            RecalculationHistory.pipe_segment_id == pipe_segment_id
        ).order_by(desc(RecalculationHistory.created_at)).first()

    @staticmethod
    def get_last_all(db: Session, limit: int = 10) -> List[RecalculationHistory]:
        return db.query(RecalculationHistory).order_by(
            desc(RecalculationHistory.created_at)
        ).limit(limit).all()

    @staticmethod
    def get_last_for_all_segments(db: Session) -> Dict[str, RecalculationHistory]:
        from sqlalchemy import distinct
        results = {}
        histories = db.query(RecalculationHistory).order_by(
            desc(RecalculationHistory.created_at)
        ).all()

        seen = set()
        for h in histories:
            if h.pipe_segment_id and h.pipe_segment_id not in seen:
                results[h.pipe_segment_id] = h
                seen.add(h.pipe_segment_id)
            elif not h.pipe_segment_id and "all" not in results:
                results["all"] = h
        return results


def get_db_session():
    return SessionLocal()
