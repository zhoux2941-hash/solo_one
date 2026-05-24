from datetime import datetime
from typing import List, Dict, Tuple, Any
from sqlalchemy.orm import Session
from storage.models import Alert, RawData
from storage.repository import RawDataRepository, AlertRepository
from snapshot_export.schemas import EvidenceItem, AlertSnapshotSummary, SummaryType
import logging

logger = logging.getLogger(__name__)


class SnapshotGenerator:
    def __init__(self, db: Session):
        self.db = db

    def _group_evidence_by_source(
        self, raw_data_list: List[RawData]
    ) -> Tuple[List[EvidenceItem], List[EvidenceItem], List[EvidenceItem]]:
        humidity = []
        video = []
        manual = []

        for data in raw_data_list:
            item = EvidenceItem(
                source_type=data.source_type,
                source_id=data.source_id,
                timestamp=data.timestamp,
                data_summary=self._summarize_data(data.source_type, data.data_payload)
            )
            if data.source_type == "humidity_sensor":
                humidity.append(item)
            elif data.source_type == "video_capture":
                video.append(item)
            elif data.source_type == "manual_inspection":
                manual.append(item)

        return humidity, video, manual

    def _summarize_data(self, source_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if source_type == "humidity_sensor":
            return {
                "humidity_percent": data.get("humidity_percent"),
                "temperature": data.get("temperature"),
                "threshold_exceeded": data.get("threshold_exceeded")
            }
        elif source_type == "video_capture":
            return {
                "leak_confidence": data.get("leak_confidence"),
                "water_area_ratio": data.get("water_area_ratio"),
                "detected_objects_count": len(data.get("detected_objects", []))
            }
        elif source_type == "manual_inspection":
            return {
                "inspector_id": data.get("inspector_id"),
                "leak_detected": data.get("leak_detected"),
                "leak_severity": data.get("leak_severity"),
                "has_notes": bool(data.get("notes")),
                "has_photos": len(data.get("photos", [])) > 0
            }
        return {}

    def _generate_key_findings(
        self,
        alert: Alert,
        humidity: List[EvidenceItem],
        video: List[EvidenceItem],
        manual: List[EvidenceItem]
    ) -> List[str]:
        findings = []

        if humidity:
            max_humidity = max(
                item.data_summary.get("humidity_percent", 0) for item in humidity
            )
            findings.append(f"湿度最高值达 {max_humidity:.1f}%（共 {len(humidity)} 条记录）")

        if video:
            max_confidence = max(
                item.data_summary.get("leak_confidence", 0) for item in video
            )
            findings.append(
                f"视频检测最高置信度 {max_confidence:.2%}（共 {len(video)} 条记录）"
            )

        if manual:
            detected_count = sum(
                1 for item in manual if item.data_summary.get("leak_detected")
            )
            inspectors = set(item.data_summary.get("inspector_id") for item in manual)
            findings.append(
                f"人工巡检发现 {detected_count} 次渗漏，涉及 {len(inspectors)} 名巡检员"
            )

        findings.append(f"告警评分 {alert.alert_score:.1f}，等级 {alert.alert_level.upper()}")

        source_types = []
        if humidity:
            source_types.append("湿度传感器")
        if video:
            source_types.append("视频监控")
        if manual:
            source_types.append("人工巡检")
        findings.append(f"多源数据验证：{'、'.join(source_types)}")

        return findings

    def _generate_recommendations(self, alert: Alert) -> List[str]:
        recommendations = []

        level = alert.alert_level.lower()
        if level == "critical":
            recommendations.append("【紧急】立即派遣维修团队现场处理")
            recommendations.append("关闭相关管段阀门，防止渗漏扩大")
        elif level == "high":
            recommendations.append("【高优先级】24小时内安排现场排查")
            recommendations.append("准备维修材料和人员")
        elif level == "medium":
            recommendations.append("【中优先级】3天内安排现场确认")
            recommendations.append("增加该区域监控频次")
        elif level == "low":
            recommendations.append("【低优先级】纳入下次例行巡检")
            recommendations.append("持续监控数据变化趋势")

        if alert.manual_count == 0:
            recommendations.append("建议安排人工巡检确认渗漏情况")

        return recommendations

    def generate_snapshot(self, alert_id: int) -> Tuple[bool, AlertSnapshotSummary, Dict[str, Any]]:
        alert = AlertRepository.get_by_id(self.db, alert_id)
        if not alert:
            return False, None, {}

        raw_data_list = RawDataRepository.get_by_alert_id(self.db, alert_id)

        if not raw_data_list:
            end_time = alert.end_time or datetime.now()
            raw_data_list = RawDataRepository.get_by_time_window(
                self.db, alert.pipe_segment_id, alert.start_time, end_time
            )
            for raw_data in raw_data_list:
                if not raw_data.belongs_to_alert_id:
                    raw_data.belongs_to_alert_id = alert_id
            self.db.commit()

        humidity, video, manual = self._group_evidence_by_source(raw_data_list)

        duration_minutes = None
        if alert.end_time:
            duration = alert.end_time - alert.start_time
            duration_minutes = duration.total_seconds() / 60

        key_findings = self._generate_key_findings(alert, humidity, video, manual)
        recommendations = self._generate_recommendations(alert)

        summary = AlertSnapshotSummary(
            alert_id=alert.id,
            alert_key=alert.alert_key,
            pipe_segment_id=alert.pipe_segment_id,
            location=alert.location,
            alert_level=alert.alert_level,
            alert_score=alert.alert_score,
            start_time=alert.start_time,
            end_time=alert.end_time,
            duration_minutes=duration_minutes,
            humidity_evidence=humidity,
            video_evidence=video,
            manual_evidence=manual,
            total_evidence=len(raw_data_list),
            key_findings=key_findings,
            recommendations=recommendations,
            generated_at=datetime.now()
        )

        evidence_summary = {
            "breakdown": {
                "humidity": len(humidity),
                "video": len(video),
                "manual": len(manual)
            },
            "findings": key_findings,
            "recommendations": recommendations
        }

        return True, summary, evidence_summary

    def generate_review_summary(self, alert_id: int) -> Tuple[bool, Dict[str, Any]]:
        success, summary, _ = self.generate_snapshot(alert_id)
        if not success:
            return False, {}

        alert = AlertRepository.get_by_id(self.db, alert_id)

        time_range = f"{summary.start_time.strftime('%Y-%m-%d %H:%M')} - "
        if summary.end_time:
            time_range += summary.end_time.strftime('%Y-%m-%d %H:%M')
        else:
            time_range += "进行中"

        critical_timeline = []
        all_evidence = summary.humidity_evidence + summary.video_evidence + summary.manual_evidence
        sorted_evidence = sorted(all_evidence, key=lambda x: x.timestamp)
        for i, item in enumerate(sorted_evidence[:10]):
            critical_timeline.append({
                "sequence": i + 1,
                "timestamp": item.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "source_type": item.source_type,
                "summary": item.data_summary
            })

        review_data = {
            "alert_id": alert.id,
            "alert_key": alert.alert_key,
            "pipe_segment_id": alert.pipe_segment_id,
            "location": alert.location,
            "alert_level": alert.alert_level,
            "alert_score": alert.alert_score,
            "time_range": time_range,
            "evidence_breakdown": {
                "humidity_sensor": len(summary.humidity_evidence),
                "video_capture": len(summary.video_evidence),
                "manual_inspection": len(summary.manual_evidence)
            },
            "critical_timeline": critical_timeline,
            "key_findings": summary.key_findings,
            "recommendations": summary.recommendations,
            "review_notes": alert.review_notes,
            "reviewer": alert.reviewed_by,
            "reviewed_at": alert.reviewed_at,
            "export_format": "json",
            "exported_at": datetime.now().isoformat()
        }

        return True, review_data

    def generate_detailed_summary(self, alert_id: int) -> Tuple[bool, Dict[str, Any]]:
        success, summary, _ = self.generate_snapshot(alert_id)
        if not success:
            return False, {}

        alert = AlertRepository.get_by_id(self.db, alert_id)

        time_range = f"{summary.start_time.strftime('%Y-%m-%d %H:%M')} - "
        if summary.end_time:
            time_range += summary.end_time.strftime('%Y-%m-%d %H:%M')
        else:
            time_range += "进行中"

        full_timeline = []
        all_evidence = summary.humidity_evidence + summary.video_evidence + summary.manual_evidence
        sorted_evidence = sorted(all_evidence, key=lambda x: x.timestamp)
        for i, item in enumerate(sorted_evidence):
            full_timeline.append({
                "sequence": i + 1,
                "timestamp": item.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "source_type": item.source_type,
                "source_id": item.source_id,
                "full_data": item.data_summary
            })

        humidity_stats = self._calculate_source_stats(summary.humidity_evidence, "humidity_percent")
        video_stats = self._calculate_source_stats(summary.video_evidence, "leak_confidence")

        detailed_data = {
            "summary_type": SummaryType.DETAILED.value,
            "alert_basic": {
                "alert_id": alert.id,
                "alert_key": alert.alert_key,
                "pipe_segment_id": alert.pipe_segment_id,
                "location": alert.location,
                "alert_level": alert.alert_level,
                "alert_score": alert.alert_score,
                "time_range": time_range,
                "duration_minutes": summary.duration_minutes,
                "status": alert.status
            },
            "evidence_breakdown": {
                "total": summary.total_evidence,
                "humidity_sensor": {
                    "count": len(summary.humidity_evidence),
                    "statistics": humidity_stats,
                    "records": [e.model_dump() for e in summary.humidity_evidence]
                },
                "video_capture": {
                    "count": len(summary.video_evidence),
                    "statistics": video_stats,
                    "records": [e.model_dump() for e in summary.video_evidence]
                },
                "manual_inspection": {
                    "count": len(summary.manual_evidence),
                    "records": [e.model_dump() for e in summary.manual_evidence]
                }
            },
            "full_timeline": full_timeline,
            "analysis": {
                "key_findings": summary.key_findings,
                "recommendations": summary.recommendations,
                "data_correlation": self._analyze_correlation(summary)
            },
            "review_info": {
                "review_notes": alert.review_notes,
                "reviewer": alert.reviewed_by,
                "reviewed_at": alert.reviewed_at.isoformat() if alert.reviewed_at else None
            },
            "exported_at": datetime.now().isoformat()
        }

        return True, detailed_data

    def generate_inspection_summary(self, alert_id: int) -> Tuple[bool, Dict[str, Any]]:
        success, summary, _ = self.generate_snapshot(alert_id)
        if not success:
            return False, {}

        alert = AlertRepository.get_by_id(self.db, alert_id)

        priority_actions = []
        level = alert.alert_level.lower()
        if level == "critical":
            priority_actions = [
                "立即关闭相关管段阀门",
                "通知应急维修班组",
                "设置现场警戒区域"
            ]
        elif level == "high":
            priority_actions = [
                "24小时内安排现场排查",
                "准备维修材料",
                "通知片区负责人"
            ]
        elif level == "medium":
            priority_actions = [
                "3天内安排巡检",
                "增加监控频次"
            ]
        else:
            priority_actions = [
                "纳入下次例行巡检"
            ]

        inspection_checklist = self._generate_checklist(alert, summary)

        inspection_data = {
            "summary_type": SummaryType.INSPECTION.value,
            "alert_card": {
                "alert_key": alert.alert_key,
                "location": alert.location,
                "pipe_segment": alert.pipe_segment_id,
                "level": alert.alert_level.upper(),
                "score": round(alert.alert_score, 1)
            },
            "quick_stats": {
                "first_detected": summary.start_time.strftime('%Y-%m-%d %H:%M'),
                "duration_hours": round((summary.duration_minutes or 0) / 60, 1),
                "evidence_count": summary.total_evidence,
                "source_types": self._get_source_types_text(summary)
            },
            "priority_actions": priority_actions,
            "inspection_checklist": inspection_checklist,
            "key_findings_brief": summary.key_findings[:3],
            "field_notes_section": {
                "inspector_name": "",
                "inspection_date": "",
                "field_findings": "",
                "photos_taken": 0,
                "repair_needed": None
            },
            "exported_at": datetime.now().isoformat()
        }

        return True, inspection_data

    def _calculate_source_stats(self, items: List[EvidenceItem], value_key: str) -> Dict[str, Any]:
        if not items:
            return {}
        values = [item.data_summary.get(value_key, 0) for item in items if item.data_summary.get(value_key)]
        if not values:
            return {}
        return {
            "min": min(values),
            "max": max(values),
            "avg": round(sum(values) / len(values), 2),
            "count": len(values)
        }

    def _analyze_correlation(self, summary: AlertSnapshotSummary) -> Dict[str, Any]:
        has_humidity = len(summary.humidity_evidence) > 0
        has_video = len(summary.video_evidence) > 0
        has_manual = len(summary.manual_evidence) > 0

        correlation_score = 0
        if has_humidity and has_video:
            correlation_score += 1
        if has_humidity and has_manual:
            correlation_score += 1
        if has_video and has_manual:
            correlation_score += 1

        return {
            "multi_source_confirmed": correlation_score >= 1,
            "correlation_level": ["无关联", "弱关联", "强关联", "完全关联"][correlation_score],
            "correlation_score": correlation_score,
            "source_combination": f"{'湿度' if has_humidity else ''}{'视频' if has_video else ''}{'人工' if has_manual else ''}"
        }

    def _get_source_types_text(self, summary: AlertSnapshotSummary) -> str:
        types = []
        if len(summary.humidity_evidence) > 0:
            types.append("湿度传感器")
        if len(summary.video_evidence) > 0:
            types.append("视频监控")
        if len(summary.manual_evidence) > 0:
            types.append("人工巡检")
        return "、".join(types)

    def _generate_checklist(self, alert: Alert, summary: AlertSnapshotSummary) -> List[Dict[str, Any]]:
        checklist = [
            {"item": "到达现场确认位置", "checked": False},
            {"item": "检查渗漏点具体情况", "checked": False},
            {"item": "拍摄现场照片", "checked": False},
            {"item": "记录渗漏严重程度", "checked": False},
            {"item": "检查周边设施影响", "checked": False}
        ]

        if len(summary.humidity_evidence) > 0:
            checklist.append({"item": "核对湿度传感器读数", "checked": False})

        if len(summary.video_evidence) > 0:
            checklist.append({"item": "复核视频监控画面", "checked": False})

        if alert.alert_level in ["high", "critical"]:
            checklist.append({"item": "评估是否需要紧急维修", "checked": False})
            checklist.append({"item": "联系相关负责人", "checked": False})

        return checklist
