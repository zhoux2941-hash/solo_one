from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from storage.models import RawData, Alert, RecalculationHistory
from storage.repository import RawDataRepository, AlertRepository, RecalculationHistoryRepository
from rules_engine.service import RulesEngineService
from rules_engine.rules import AlertRules
import logging

logger = logging.getLogger(__name__)


class TimeWindowMerger:
    def __init__(self, db, time_window_minutes: int = 30):
        self.db = db
        self.time_window_minutes = time_window_minutes
        self.rules_engine = RulesEngineService(db)

    def _generate_alert_key(self, pipe_segment_id: str, base_time: datetime) -> str:
        window_start = base_time.replace(
            minute=(base_time.minute // self.time_window_minutes * self.time_window_minutes),
            second=0,
            microsecond=0
        )
        return f"{pipe_segment_id}_{window_start.strftime('%Y%m%d_%H%M')}"

    def _find_overlapping_alert(
        self,
        pipe_segment_id: str,
        event_time: datetime
    ) -> Optional[Alert]:
        window_start = event_time - timedelta(minutes=self.time_window_minutes)
        window_end = event_time + timedelta(minutes=self.time_window_minutes)

        alerts = AlertRepository.get_by_pipe_segment(self.db, pipe_segment_id)

        for alert in alerts:
            if alert.is_archived:
                continue
            alert_end = alert.end_time or alert.start_time + timedelta(hours=1)
            if alert.start_time <= window_end and alert_end >= window_start:
                return alert

        return None

    def _group_raw_data_by_segment(self, raw_data_list: List[RawData]) -> Dict[str, List[RawData]]:
        grouped = defaultdict(list)
        for data in raw_data_list:
            grouped[data.pipe_segment_id].append(data)
        return grouped

    def process_unprocessed_data(self, limit: int = 100) -> Tuple[int, int, int]:
        raw_data_list = RawDataRepository.get_unprocessed(self.db, limit)
        if not raw_data_list:
            return 0, 0, 0

        processed_count = 0
        new_alerts_count = 0
        updated_alerts_count = 0

        grouped_data = self._group_raw_data_by_segment(raw_data_list)

        for pipe_segment_id, data_list in grouped_data.items():
            sorted_data = sorted(data_list, key=lambda x: x.timestamp)

            alert_data_groups = self._cluster_into_alert_windows(sorted_data, pipe_segment_id)

            for window_data, target_alert in alert_data_groups:
                if target_alert:
                    self._update_existing_alert_batch(target_alert, window_data)
                    updated_alerts_count += 1
                else:
                    new_alert = self._create_new_alert_batch(pipe_segment_id, window_data)
                    if new_alert:
                        target_alert = new_alert
                        new_alerts_count += 1

                for raw_data in window_data:
                    RawDataRepository.mark_as_processed(
                        self.db, raw_data.id, target_alert.id if target_alert else None
                    )
                    processed_count += 1

            self._try_merge_adjacent_alerts(pipe_segment_id)

        logger.info(
            f"Processed {processed_count} records: "
            f"{new_alerts_count} new alerts, "
            f"{updated_alerts_count} updated alerts"
        )
        return processed_count, new_alerts_count, updated_alerts_count

    def _cluster_into_alert_windows(
        self,
        sorted_data: List[RawData],
        pipe_segment_id: str
    ) -> List[Tuple[List[RawData], Optional[Alert]]]:
        if not sorted_data:
            return []

        clusters = []
        current_cluster = [sorted_data[0]]
        current_cluster_start = sorted_data[0].timestamp

        for i in range(1, len(sorted_data)):
            time_diff = sorted_data[i].timestamp - current_cluster_start
            if time_diff <= timedelta(minutes=self.time_window_minutes * 2):
                current_cluster.append(sorted_data[i])
            else:
                clusters.append(current_cluster)
                current_cluster = [sorted_data[i]]
                current_cluster_start = sorted_data[i].timestamp

        if current_cluster:
            clusters.append(current_cluster)

        result = []
        for cluster in clusters:
            cluster_start = min(d.timestamp for d in cluster)
            cluster_end = max(d.timestamp for d in cluster)

            existing_alert = self._find_alert_in_range(
                pipe_segment_id, cluster_start, cluster_end
            )

            result.append((cluster, existing_alert))

        return result

    def _find_alert_in_range(
        self,
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> Optional[Alert]:
        alerts = AlertRepository.get_by_pipe_segment(self.db, pipe_segment_id)

        for alert in alerts:
            if alert.is_archived:
                continue

            alert_end = alert.end_time or alert.start_time + timedelta(hours=1)

            search_start = start_time - timedelta(minutes=self.time_window_minutes)
            search_end = end_time + timedelta(minutes=self.time_window_minutes)

            if alert.start_time <= search_end and alert_end >= search_start:
                return alert

        return None

    def _create_new_alert_batch(
        self,
        pipe_segment_id: str,
        data_list: List[RawData]
    ) -> Optional[Alert]:
        from storage.models import Alert

        if not data_list:
            return None

        start_time = min(d.timestamp for d in data_list)
        end_time = max(d.timestamp for d in data_list)

        rule_result = self.rules_engine.evaluate_time_window(
            data_list,
            pipe_segment_id,
            start_time,
            end_time
        )

        if not AlertRules.should_create_alert(rule_result):
            logger.info(f"Skipping alert creation for {pipe_segment_id}: insufficient evidence")
            return None

        alert_key = self._generate_alert_key(pipe_segment_id, start_time)

        existing_alert = AlertRepository.get_by_key(self.db, alert_key)
        if existing_alert:
            return existing_alert

        alert = Alert(
            alert_key=alert_key,
            pipe_segment_id=pipe_segment_id,
            location=data_list[0].location,
            alert_level=rule_result.alert_level.value,
            alert_score=rule_result.alert_score,
            start_time=start_time,
            end_time=end_time,
            status="pending_review",
            humidity_count=rule_result.contributing_sources["humidity_sensor"],
            video_count=rule_result.contributing_sources["video_capture"],
            manual_count=rule_result.contributing_sources["manual_inspection"],
            evidence_count=rule_result.evidence_count
        )

        saved_alert = AlertRepository.create(self.db, alert)
        logger.info(f"Created new alert {saved_alert.id} for {pipe_segment_id}")
        return saved_alert

    def _update_existing_alert_batch(self, alert: Alert, new_data_list: List[RawData]):
        min_time = min(d.timestamp for d in new_data_list)
        max_time = max(d.timestamp for d in new_data_list)

        if min_time < alert.start_time:
            alert.start_time = min_time
        if alert.end_time is None or max_time > alert.end_time:
            alert.end_time = max_time

        all_data = RawDataRepository.get_by_alert_id(self.db, alert.id)
        all_data.extend(new_data_list)

        self.rules_engine.update_alert_level(
            alert.id,
            all_data,
            alert.pipe_segment_id,
            alert.start_time,
            alert.end_time
        )

    def _try_merge_adjacent_alerts(self, pipe_segment_id: str):
        alerts = AlertRepository.get_by_pipe_segment(self.db, pipe_segment_id)
        active_alerts = [a for a in alerts if not a.is_archived]

        if len(active_alerts) < 2:
            return 0

        active_alerts.sort(key=lambda x: x.start_time)

        merged_count = 0
        i = 0
        while i < len(active_alerts) - 1:
            current = active_alerts[i]
            next_alert = active_alerts[i + 1]

            current_end = current.end_time or current.start_time + timedelta(hours=1)
            gap = next_alert.start_time - current_end

            if gap <= timedelta(minutes=self.time_window_minutes * 2):
                merged_count += 1
                self._merge_two_alerts(current, next_alert)
                active_alerts.remove(next_alert)
            else:
                i += 1

        if merged_count > 0:
            logger.info(f"Merged {merged_count} adjacent alerts for {pipe_segment_id}")
        return merged_count

    def _merge_two_alerts(self, alert1: Alert, alert2: Alert):
        REVIEWED_STATUSES = ["confirmed", "resolved", "closed_no_issue", "closed_false_positive"]

        if alert1.status in REVIEWED_STATUSES and alert2.status not in REVIEWED_STATUSES:
            target, source = alert1, alert2
        elif alert2.status in REVIEWED_STATUSES:
            target, source = alert2, alert1
        else:
            target, source = alert1, alert2

        target.start_time = min(target.start_time, source.start_time)
        target.end_time = max(
            target.end_time or target.start_time,
            source.end_time or source.start_time
        )

        source_raw_data = RawDataRepository.get_by_alert_id(self.db, source.id)
        for raw_data in source_raw_data:
            raw_data.belongs_to_alert_id = target.id

        source.is_archived = True
        source.status = "merged"

        self.db.commit()

        all_raw_data = RawDataRepository.get_by_alert_id(self.db, target.id)
        self.rules_engine.update_alert_level(
            target.id,
            all_raw_data,
            target.pipe_segment_id,
            target.start_time,
            target.end_time or target.start_time
        )

    def process_late_data(self, cutoff_time: datetime) -> int:
        late_data = RawDataRepository.get_late_arriving_data(self.db, cutoff_time)
        if not late_data:
            return 0

        grouped_data = self._group_raw_data_by_segment(late_data)
        updated_count = 0

        REVIEWED_STATUSES = ["confirmed", "resolved", "closed_no_issue", "closed_false_positive"]

        for pipe_segment_id, data_list in grouped_data.items():
            sorted_data = sorted(data_list, key=lambda x: x.timestamp)
            alert_data_groups = self._cluster_into_alert_windows(sorted_data, pipe_segment_id)

            for window_data, target_alert in alert_data_groups:
                if target_alert and target_alert.status in REVIEWED_STATUSES:
                    logger.info(
                        f"Skipping late data merge for reviewed alert {target_alert.id}"
                    )
                    for raw_data in window_data:
                        RawDataRepository.mark_as_processed(self.db, raw_data.id, target_alert.id)
                        updated_count += 1
                    continue

                if target_alert:
                    self._update_existing_alert_batch(target_alert, window_data)
                else:
                    new_alert = self._create_new_alert_batch(pipe_segment_id, window_data)
                    if new_alert:
                        target_alert = new_alert

                for raw_data in window_data:
                    RawDataRepository.mark_as_processed(
                        self.db, raw_data.id, target_alert.id if target_alert else None
                    )
                    updated_count += 1

            self._try_merge_adjacent_alerts(pipe_segment_id)

        logger.info(f"Processed {len(late_data)} late records, updated {updated_count} alerts")
        return updated_count

    def recalculate_pipe_segment(self, pipe_segment_id: str) -> Tuple[int, int]:
        alerts = AlertRepository.get_by_pipe_segment(self.db, pipe_segment_id)
        recalculated_count = 0
        deleted_count = 0

        REVIEWED_STATUSES = ["confirmed", "resolved", "closed_no_issue", "closed_false_positive"]

        for alert in alerts:
            if alert.status in REVIEWED_STATUSES or alert.reviewed_at is not None:
                logger.info(
                    f"Skipping recalculation for reviewed alert {alert.id} "
                    f"(status: {alert.status})"
                )
                continue

            raw_data_list = RawDataRepository.get_by_alert_id(self.db, alert.id)
            if not raw_data_list:
                raw_data_list = RawDataRepository.get_by_time_window(
                    self.db, pipe_segment_id, alert.start_time, alert.end_time or datetime.now()
                )

            rule_result = self.rules_engine.evaluate_time_window(
                raw_data_list,
                pipe_segment_id,
                alert.start_time,
                alert.end_time or datetime.now()
            )

            if not AlertRules.should_create_alert(rule_result):
                alert.is_archived = True
                alert.status = "closed_no_issue"
                deleted_count += 1
            else:
                alert.alert_level = rule_result.alert_level.value
                alert.alert_score = rule_result.alert_score
                alert.humidity_count = rule_result.contributing_sources["humidity_sensor"]
                alert.video_count = rule_result.contributing_sources["video_capture"]
                alert.manual_count = rule_result.contributing_sources["manual_inspection"]
                alert.evidence_count = rule_result.evidence_count
                recalculated_count += 1

            AlertRepository.update(self.db, alert)

        merged_count = self._try_merge_adjacent_alerts(pipe_segment_id)

        logger.info(
            f"Recalculated {pipe_segment_id}: "
            f"{recalculated_count} updated, {deleted_count} archived, "
            f"{merged_count} merged"
        )
        return recalculated_count + merged_count, deleted_count

    def recalculate_by_date_range(
        self,
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime,
        executed_by: str = None,
        save_history: bool = True
    ) -> Tuple[int, int, int]:
        history = None
        if save_history:
            history = RecalculationHistory(
                pipe_segment_id=pipe_segment_id,
                scope_type="date_range",
                start_time=start_time,
                end_time=end_time,
                parameters={
                    "pipe_segment_id": pipe_segment_id,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat()
                },
                executed_by=executed_by,
                status="running"
            )
            history = RecalculationHistoryRepository.create(self.db, history)

        try:
            raw_data_in_range = RawDataRepository.get_by_time_window(
                self.db, pipe_segment_id, start_time, end_time
            )

            for raw_data in raw_data_in_range:
                raw_data.is_processed = False
                raw_data.belongs_to_alert_id = None
            self.db.commit()

            alerts_to_clear = self.db.query(Alert).filter(
                and_(
                    Alert.pipe_segment_id == pipe_segment_id,
                    Alert.start_time <= end_time,
                    or_(Alert.end_time >= start_time, Alert.end_time == None)
                )
            ).all()

            REVIEWED_STATUSES = ["confirmed", "resolved", "closed_no_issue", "closed_false_positive"]
            for alert in alerts_to_clear:
                if alert.status not in REVIEWED_STATUSES and alert.reviewed_at is None:
                    alert.is_archived = True
                    alert.status = "recalculating"
            self.db.commit()

            processed, new_alerts, updated = self.process_unprocessed_data(limit=len(raw_data_in_range) + 100)

            merged_count = self._try_merge_adjacent_alerts(pipe_segment_id)

            final_alerts = self.db.query(Alert).filter(
                and_(
                    Alert.pipe_segment_id == pipe_segment_id,
                    Alert.is_archived == False,
                    Alert.start_time <= end_time,
                    or_(Alert.end_time >= start_time, Alert.end_time == None)
                )
            ).all()

            recalculated = len(final_alerts)
            archived = len([a for a in alerts_to_clear if a.is_archived and a.status == "recalculating"])

            if history:
                history.alerts_updated = recalculated
                history.alerts_archived = archived
                history.alerts_merged = merged_count
                history.status = "completed"
                RecalculationHistoryRepository.update(self.db, history)

            logger.info(
                f"Date range recalculation for {pipe_segment_id} [{start_time} - {end_time}]: "
                f"{recalculated} recalculated, {archived} archived, {merged_count} merged"
            )
            return recalculated, archived, merged_count

        except Exception as e:
            if history:
                history.status = "failed"
                history.error_message = str(e)
                RecalculationHistoryRepository.update(self.db, history)
            logger.error(f"Date range recalculation failed: {str(e)}")
            raise

    def recalculate_all_segments_by_date_range(
        self,
        start_time: datetime,
        end_time: datetime,
        executed_by: str = None
    ) -> Dict[str, Tuple[int, int, int]]:
        from storage.repository import PipeSegmentRepository

        segments = PipeSegmentRepository.get_all_active(self.db)
        results = {}

        history = RecalculationHistory(
            pipe_segment_id=None,
            scope_type="all_segments_date_range",
            start_time=start_time,
            end_time=end_time,
            parameters={
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "segments_count": len(segments)
            },
            executed_by=executed_by,
            status="running"
        )
        history = RecalculationHistoryRepository.create(self.db, history)

        total_updated = 0
        total_archived = 0
        total_merged = 0

        try:
            for segment in segments:
                updated, archived, merged = self.recalculate_by_date_range(
                    segment.segment_id,
                    start_time,
                    end_time,
                    executed_by,
                    save_history=False
                )
                results[segment.segment_id] = (updated, archived, merged)
                total_updated += updated
                total_archived += archived
                total_merged += merged

            history.alerts_updated = total_updated
            history.alerts_archived = total_archived
            history.alerts_merged = total_merged
            history.status = "completed"
            RecalculationHistoryRepository.update(self.db, history)

            return results
        except Exception as e:
            history.status = "failed"
            history.error_message = str(e)
            RecalculationHistoryRepository.update(self.db, history)
            raise
