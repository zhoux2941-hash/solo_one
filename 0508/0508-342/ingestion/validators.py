from typing import Dict, Any, Tuple, Optional
from ingestion.schemas import SourceType, HumiditySensorData, VideoCaptureData, ManualInspectionData


class DataValidator:
    @staticmethod
    def validate_source_data(
        source_type: SourceType,
        data: Dict[str, Any]
    ) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        try:
            if source_type == SourceType.HUMIDITY_SENSOR:
                validated = HumiditySensorData(**data)
                return True, None, validated.model_dump()
            elif source_type == SourceType.VIDEO_CAPTURE:
                validated = VideoCaptureData(**data)
                return True, None, validated.model_dump()
            elif source_type == SourceType.MANUAL_INSPECTION:
                validated = ManualInspectionData(**data)
                return True, None, validated.model_dump()
            else:
                return False, f"Unknown source type: {source_type}", None
        except Exception as e:
            return False, str(e), None

    @staticmethod
    def check_leak_indication(source_type: SourceType, data: Dict[str, Any]) -> bool:
        if source_type == SourceType.HUMIDITY_SENSOR:
            return data.get("threshold_exceeded", False) or data.get("humidity_percent", 0) > 80
        elif source_type == SourceType.VIDEO_CAPTURE:
            return data.get("leak_confidence", 0) > 0.5
        elif source_type == SourceType.MANUAL_INSPECTION:
            return data.get("leak_detected", False)
        return False

    @staticmethod
    def calculate_data_weight(source_type: SourceType, data: Dict[str, Any]) -> float:
        if source_type == SourceType.HUMIDITY_SENSOR:
            humidity = data.get("humidity_percent", 0)
            if humidity > 90:
                return 3.0
            elif humidity > 80:
                return 2.0
            elif humidity > 70:
                return 1.0
            return 0.5
        elif source_type == SourceType.VIDEO_CAPTURE:
            confidence = data.get("leak_confidence", 0)
            if confidence > 0.8:
                return 4.0
            elif confidence > 0.6:
                return 3.0
            elif confidence > 0.4:
                return 2.0
            return 1.0
        elif source_type == SourceType.MANUAL_INSPECTION:
            severity = data.get("leak_severity", "")
            if severity == "critical":
                return 5.0
            elif severity == "high":
                return 4.0
            elif severity == "medium":
                return 3.0
            elif severity == "low":
                return 2.0
            return 1.0 if data.get("leak_detected") else 0.5
        return 1.0
