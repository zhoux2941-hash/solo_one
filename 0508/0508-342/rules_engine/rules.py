from typing import List, Dict, Any, Tuple
from datetime import datetime
from storage.models import RawData
from ingestion.schemas import SourceType
from rules_engine.schemas import AlertLevel, AlertRuleResult, TimeWindowStats
from ingestion.validators import DataValidator


class AlertRules:
    @staticmethod
    def calculate_source_counts(raw_data_list: List[RawData]) -> Dict[str, int]:
        counts = {
            "humidity_sensor": 0,
            "video_capture": 0,
            "manual_inspection": 0
        }
        for data in raw_data_list:
            if data.source_type in counts:
                counts[data.source_type] += 1
        return counts

    @staticmethod
    def calculate_time_window_stats(
        raw_data_list: List[RawData],
        pipe_segment_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> TimeWindowStats:
        humidity_values = []
        video_confidences = []
        manual_detection_count = 0

        for data in raw_data_list:
            if data.source_type == SourceType.HUMIDITY_SENSOR:
                humidity = data.data_payload.get("humidity_percent")
                if humidity is not None:
                    humidity_values.append(humidity)
            elif data.source_type == SourceType.VIDEO_CAPTURE:
                confidence = data.data_payload.get("leak_confidence")
                if confidence is not None:
                    video_confidences.append(confidence)
            elif data.source_type == SourceType.MANUAL_INSPECTION:
                if data.data_payload.get("leak_detected"):
                    manual_detection_count += 1

        source_counts = AlertRules.calculate_source_counts(raw_data_list)

        return TimeWindowStats(
            pipe_segment_id=pipe_segment_id,
            start_time=start_time,
            end_time=end_time,
            total_records=len(raw_data_list),
            humidity_records=source_counts["humidity_sensor"],
            video_records=source_counts["video_capture"],
            manual_records=source_counts["manual_inspection"],
            avg_humidity=sum(humidity_values) / len(humidity_values) if humidity_values else None,
            max_humidity=max(humidity_values) if humidity_values else None,
            avg_video_confidence=sum(video_confidences) / len(video_confidences) if video_confidences else None,
            max_video_confidence=max(video_confidences) if video_confidences else None,
            manual_detection_count=manual_detection_count
        )

    @staticmethod
    def apply_rules(stats: TimeWindowStats) -> AlertRuleResult:
        score = 0.0
        rules_triggered = []
        recommendations = []

        if stats.max_humidity and stats.max_humidity > 90:
            score += 30
            rules_triggered.append("HUMIDITY_CRITICAL")
            recommendations.append("立即检查该区域，湿度严重超标")
        elif stats.max_humidity and stats.max_humidity > 80:
            score += 20
            rules_triggered.append("HUMIDITY_HIGH")
            recommendations.append("关注该区域湿度变化，考虑安排巡检")
        elif stats.max_humidity and stats.max_humidity > 70:
            score += 10
            rules_triggered.append("HUMIDITY_ELEVATED")
            recommendations.append("持续监控湿度水平")

        if stats.max_video_confidence and stats.max_video_confidence > 0.8:
            score += 35
            rules_triggered.append("VIDEO_HIGH_CONFIDENCE")
            recommendations.append("视频检测到高置信度渗漏，建议优先复核")
        elif stats.max_video_confidence and stats.max_video_confidence > 0.6:
            score += 25
            rules_triggered.append("VIDEO_MEDIUM_CONFIDENCE")
            recommendations.append("视频检测到疑似渗漏，请复核")
        elif stats.max_video_confidence and stats.max_video_confidence > 0.4:
            score += 15
            rules_triggered.append("VIDEO_LOW_CONFIDENCE")
            recommendations.append("视频检测到异常，建议结合其他数据源")

        if stats.manual_detection_count >= 2:
            score += 40
            rules_triggered.append("MULTIPLE_MANUAL_DETECTIONS")
            recommendations.append("多次人工检测到渗漏，建议立即启动维修流程")
        elif stats.manual_detection_count == 1:
            score += 25
            rules_triggered.append("SINGLE_MANUAL_DETECTION")
            recommendations.append("人工检测到渗漏，请安排进一步确认")

        source_types_present = 0
        if stats.humidity_records > 0:
            source_types_present += 1
        if stats.video_records > 0:
            source_types_present += 1
        if stats.manual_records > 0:
            source_types_present += 1

        if source_types_present >= 3:
            score += 15
            rules_triggered.append("MULTI_SOURCE_CORRELATION")
            recommendations.append("多源数据关联确认，可信度高")
        elif source_types_present >= 2:
            score += 10
            rules_triggered.append("DUAL_SOURCE_CORRELATION")
            recommendations.append("双源数据关联，可信度中等")

        if stats.total_records >= 10:
            score += 10
            rules_triggered.append("HIGH_FREQUENCY")
            recommendations.append("该区域数据上报频繁，建议重点关注")
        elif stats.total_records >= 5:
            score += 5
            rules_triggered.append("MEDIUM_FREQUENCY")

        alert_level = AlertRules._score_to_level(score)
        contributing_sources = {
            "humidity_sensor": stats.humidity_records,
            "video_capture": stats.video_records,
            "manual_inspection": stats.manual_records
        }
        evidence_count = stats.humidity_records + stats.video_records + stats.manual_records

        return AlertRuleResult(
            alert_level=alert_level,
            alert_score=score,
            evidence_count=evidence_count,
            contributing_sources=contributing_sources,
            rule_triggered=rules_triggered,
            recommendations=recommendations
        )

    @staticmethod
    def _score_to_level(score: float) -> AlertLevel:
        if score >= 70:
            return AlertLevel.CRITICAL
        elif score >= 50:
            return AlertLevel.HIGH
        elif score >= 30:
            return AlertLevel.MEDIUM
        elif score >= 15:
            return AlertLevel.LOW
        else:
            return AlertLevel.INFO

    @staticmethod
    def should_create_alert(rule_result: AlertRuleResult) -> bool:
        return rule_result.alert_level in [
            AlertLevel.LOW,
            AlertLevel.MEDIUM,
            AlertLevel.HIGH,
            AlertLevel.CRITICAL
        ] and rule_result.evidence_count >= 2
