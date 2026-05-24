from typing import List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from storage.models import RawData
from storage.repository import AlertRepository
from rules_engine.rules import AlertRules
from rules_engine.schemas import AlertRuleResult, TimeWindowStats, AlertLevel
import logging

logger = logging.getLogger(__name__)


class RulesEngineService:
    def __init__(self, db: Session):
        self.db = db
        self.rules = AlertRules()

    def evaluate_time_window(
        self,
        raw_data_list: List[RawData],
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> AlertRuleResult:
        stats = self.rules.calculate_time_window_stats(
            raw_data_list, pipe_segment_id, start_time, end_time
        )
        result = self.rules.apply_rules(stats)
        return result

    def update_alert_level(
        self,
        alert_id: int,
        raw_data_list: List[RawData],
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> Tuple[bool, str]:
        try:
            alert = AlertRepository.get_by_id(self.db, alert_id)
            if not alert:
                return False, "Alert not found"

            REVIEWED_STATUSES = ["confirmed", "resolved", "closed_no_issue", "closed_false_positive"]

            rule_result = self.evaluate_time_window(
                raw_data_list, pipe_segment_id, start_time, end_time
            )

            original_status = alert.status
            original_reviewed_at = alert.reviewed_at
            original_reviewed_by = alert.reviewed_by
            original_review_notes = alert.review_notes
            original_is_archived = alert.is_archived

            alert.alert_level = rule_result.alert_level.value
            alert.alert_score = rule_result.alert_score
            alert.humidity_count = rule_result.contributing_sources["humidity_sensor"]
            alert.video_count = rule_result.contributing_sources["video_capture"]
            alert.manual_count = rule_result.contributing_sources["manual_inspection"]
            alert.evidence_count = rule_result.evidence_count

            if original_status in REVIEWED_STATUSES:
                alert.status = original_status
                alert.reviewed_at = original_reviewed_at
                alert.reviewed_by = original_reviewed_by
                alert.review_notes = original_review_notes
                alert.is_archived = original_is_archived
                logger.info(
                    f"Updated alert {alert_id} counts but preserved reviewed status "
                    f"(status: {original_status})"
                )
            else:
                logger.info(
                    f"Updated alert {alert_id} level to {rule_result.alert_level} "
                    f"with score {rule_result.alert_score}"
                )

            AlertRepository.update(self.db, alert)
            return True, "Alert level updated"
        except Exception as e:
            logger.error(f"Failed to update alert level: {str(e)}")
            return False, str(e)

    def recalculate_alert(self, alert_id: int, force: bool = False) -> Tuple[bool, str, AlertRuleResult]:
        from storage.repository import RawDataRepository

        try:
            alert = AlertRepository.get_by_id(self.db, alert_id)
            if not alert:
                return False, "Alert not found", None

            REVIEWED_STATUSES = ["confirmed", "resolved", "closed_no_issue", "closed_false_positive"]
            if not force and (alert.status in REVIEWED_STATUSES or alert.reviewed_at is not None):
                logger.info(
                    f"Skipping recalculation for reviewed alert {alert_id} "
                    f"(status: {alert.status})"
                )
                return False, "Alert has been reviewed, skipping recalculation", None

            raw_data_list = RawDataRepository.get_by_alert_id(self.db, alert_id)
            if not raw_data_list:
                raw_data_list = RawDataRepository.get_by_time_window(
                    self.db, alert.pipe_segment_id, alert.start_time, alert.end_time or datetime.now()
                )

            rule_result = self.evaluate_time_window(
                raw_data_list,
                alert.pipe_segment_id,
                alert.start_time,
                alert.end_time or datetime.now()
            )

            alert.alert_level = rule_result.alert_level.value
            alert.alert_score = rule_result.alert_score
            alert.humidity_count = rule_result.contributing_sources["humidity_sensor"]
            alert.video_count = rule_result.contributing_sources["video_capture"]
            alert.manual_count = rule_result.contributing_sources["manual_inspection"]
            alert.evidence_count = rule_result.evidence_count

            AlertRepository.update(self.db, alert)

            logger.info(f"Recalculated alert {alert_id}: {rule_result.alert_level}")
            return True, "Recalculated successfully", rule_result
        except Exception as e:
            logger.error(f"Failed to recalculate alert: {str(e)}")
            return False, str(e), None
