from sqlalchemy.orm import Session
from typing import Tuple, Dict, Any
from datetime import datetime
import json
from storage.models import AlertSnapshot
from storage.repository import AlertSnapshotRepository
from snapshot_export.generator import SnapshotGenerator
from snapshot_export.schemas import SummaryType
import logging

logger = logging.getLogger(__name__)


class SnapshotExportService:
    def __init__(self, db: Session):
        self.db = db
        self.generator = SnapshotGenerator(db)

    def generate_alert_snapshot(self, alert_id: int) -> Tuple[bool, AlertSnapshot]:
        try:
            success, summary, evidence_summary = self.generator.generate_snapshot(alert_id)
            if not success:
                return False, None

            snapshot = AlertSnapshot(
                alert_id=alert_id,
                snapshot_type="auto_generated",
                summary="\n".join(summary.key_findings),
                evidence_summary=evidence_summary,
                export_format="json"
            )

            saved_snapshot = AlertSnapshotRepository.create(self.db, snapshot)
            logger.info(f"Generated snapshot for alert {alert_id}")
            return True, saved_snapshot
        except Exception as e:
            logger.error(f"Failed to generate snapshot: {str(e)}")
            return False, None

    def export_review_summary(self, alert_id: int) -> Tuple[bool, Dict[str, Any]]:
        try:
            success, review_data = self.generator.generate_review_summary(alert_id)
            if not success:
                return False, {}

            snapshot = AlertSnapshot(
                alert_id=alert_id,
                snapshot_type="review_export",
                summary=json.dumps(review_data, ensure_ascii=False, indent=2),
                evidence_summary=review_data,
                export_format="json"
            )
            AlertSnapshotRepository.create(self.db, snapshot)

            logger.info(f"Exported review summary for alert {alert_id}")
            return True, review_data
        except Exception as e:
            logger.error(f"Failed to export review summary: {str(e)}")
            return False, {}

    def get_alert_snapshots(self, alert_id: int):
        return AlertSnapshotRepository.get_by_alert_id(self.db, alert_id)

    def export_to_text(self, alert_id: int) -> Tuple[bool, str]:
        success, review_data = self.export_review_summary(alert_id)
        if not success:
            return False, ""

        text = f"""
{'='*60}
渗漏告警复盘摘要
{'='*60}

告警编号: {review_data['alert_key']}
管段: {review_data['pipe_segment_id']}
位置: {review_data['location']}
告警等级: {review_data['alert_level'].upper()}
告警评分: {review_data['alert_score']:.1f}
时间范围: {review_data['time_range']}

{'='*60}
证据统计
{'='*60}
湿度传感器: {review_data['evidence_breakdown']['humidity_sensor']} 条
视频监控: {review_data['evidence_breakdown']['video_capture']} 条
人工巡检: {review_data['evidence_breakdown']['manual_inspection']} 条

{'='*60}
关键发现
{'='*60}
"""
        for i, finding in enumerate(review_data.get('key_findings', []), 1):
            text += f"{i}. {finding}\n"

        text += f"""
{'='*60}
处置建议
{'='*60}
"""
        for i, rec in enumerate(review_data.get('recommendations', []), 1):
            text += f"{i}. {rec}\n"

        if review_data.get('review_notes'):
            text += f"""
{'='*60}
复核备注
{'='*60}
复核人: {review_data.get('reviewer', '未指定')}
复核时间: {review_data.get('reviewed_at', '未复核')}
备注: {review_data['review_notes']}
"""

        text += f"""
{'='*60}
导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'='*60}
"""
        return True, text

    def export_detailed_summary(self, alert_id: int) -> Tuple[bool, Dict[str, Any]]:
        try:
            success, detailed_data = self.generator.generate_detailed_summary(alert_id)
            if not success:
                return False, {}

            snapshot = AlertSnapshot(
                alert_id=alert_id,
                snapshot_type="detailed_export",
                summary=json.dumps(detailed_data, ensure_ascii=False, indent=2),
                evidence_summary={"summary_type": "detailed"},
                export_format="json"
            )
            AlertSnapshotRepository.create(self.db, snapshot)

            logger.info(f"Exported detailed summary for alert {alert_id}")
            return True, detailed_data
        except Exception as e:
            logger.error(f"Failed to export detailed summary: {str(e)}")
            return False, {}

    def export_inspection_summary(self, alert_id: int) -> Tuple[bool, Dict[str, Any]]:
        try:
            success, inspection_data = self.generator.generate_inspection_summary(alert_id)
            if not success:
                return False, {}

            snapshot = AlertSnapshot(
                alert_id=alert_id,
                snapshot_type="inspection_export",
                summary=json.dumps(inspection_data, ensure_ascii=False, indent=2),
                evidence_summary={"summary_type": "inspection"},
                export_format="json"
            )
            AlertSnapshotRepository.create(self.db, snapshot)

            logger.info(f"Exported inspection summary for alert {alert_id}")
            return True, inspection_data
        except Exception as e:
            logger.error(f"Failed to export inspection summary: {str(e)}")
            return False, {}

    def export_summary(
        self,
        alert_id: int,
        summary_type: SummaryType
    ) -> Tuple[bool, Dict[str, Any]]:
        if summary_type == SummaryType.DETAILED:
            return self.export_detailed_summary(alert_id)
        elif summary_type == SummaryType.INSPECTION:
            return self.export_inspection_summary(alert_id)
        else:
            return self.export_review_summary(alert_id)

    def export_inspection_summary_to_text(self, alert_id: int) -> Tuple[bool, str]:
        success, inspection_data = self.export_inspection_summary(alert_id)
        if not success:
            return False, ""

        alert_card = inspection_data["alert_card"]
        quick_stats = inspection_data["quick_stats"]
        actions = inspection_data["priority_actions"]
        checklist = inspection_data["inspection_checklist"]

        text = f"""
{'='*60}
渗漏告警巡检单
{'='*60}

【告警信息卡】
  告警编号: {alert_card['alert_key']}
  管段: {alert_card['pipe_segment']}
  位置: {alert_card['location']}
  等级: {'🔴' if alert_card['level'] in ['CRITICAL', 'HIGH'] else '🟡' if alert_card['level'] == 'MEDIUM' else '🟢'} {alert_card['level']}
  评分: {alert_card['score']}

【快速统计】
  首次发现: {quick_stats['first_detected']}
  持续时长: {quick_stats['duration_hours']} 小时
  证据数量: {quick_stats['evidence_count']} 条
  数据来源: {quick_stats['source_types']}

{'='*60}
优先行动项
{'='*60}
"""
        for i, action in enumerate(actions, 1):
            text += f"  [ ] {i}. {action}\n"

        text += f"""
{'='*60}
现场巡检清单
{'='*60}
"""
        for item in checklist:
            text += f"  [ ] {item['item']}\n"

        text += f"""
{'='*60}
【关键发现】
"""
        for i, finding in enumerate(inspection_data.get('key_findings_brief', []), 1):
            text += f"  {i}. {finding}\n"

        text += f"""
{'='*60}
【现场记录区】

  巡检员姓名: _______________________

  巡检日期: _______________________

  现场发现:
  ________________________________
  ________________________________
  ________________________________

  拍摄照片数: _______ 张

  需要维修: □ 是   □ 否   □ 待评估

{'='*60}
导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'='*60}
"""
        return True, text
