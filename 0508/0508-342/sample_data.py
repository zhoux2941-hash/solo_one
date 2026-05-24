from datetime import datetime, timedelta
import requests
import json

BASE_URL = "http://localhost:8000"


def create_sample_segment():
    print("Creating sample pipe segments...")
    segments = [
        {"segment_id": "PIPE-001", "name": "东区主管道", "location": "东大街123号"},
        {"segment_id": "PIPE-002", "name": "西区支路管道", "location": "西大街456号"},
        {"segment_id": "PIPE-003", "name": "南区供水管道", "location": "南大街789号"},
    ]
    for seg in segments:
        response = requests.post(
            f"{BASE_URL}/admin/segments",
            params=seg
        )
        print(f"  {seg['segment_id']}: {response.json()}")


def send_humidity_data(segment_id, location, humidity):
    timestamp = (datetime.now() - timedelta(minutes=5)).isoformat()
    response = requests.post(
        f"{BASE_URL}/ingest/humidity",
        params={
            "source_id": f"HUM-{segment_id}",
            "pipe_segment_id": segment_id,
            "location": location,
            "timestamp": timestamp,
            "humidity_percent": humidity,
            "temperature": 22.5
        }
    )
    return response.json()


def send_video_data(segment_id, location, confidence):
    timestamp = (datetime.now() - timedelta(minutes=3)).isoformat()
    response = requests.post(
        f"{BASE_URL}/ingest/video",
        params={
            "source_id": f"CAM-{segment_id}",
            "pipe_segment_id": segment_id,
            "location": location,
            "timestamp": timestamp,
            "leak_confidence": confidence,
            "model_version": "v2.1.0"
        }
    )
    return response.json()


def send_manual_data(segment_id, location, detected, severity=None):
    timestamp = (datetime.now() - timedelta(minutes=1)).isoformat()
    response = requests.post(
        f"{BASE_URL}/ingest/manual",
        params={
            "source_id": f"INSP-{segment_id}",
            "pipe_segment_id": segment_id,
            "location": location,
            "timestamp": timestamp,
            "inspector_id": "INSPECTOR-001",
            "leak_detected": detected,
            "leak_severity": severity
        }
    )
    return response.json()


def generate_sample_alerts():
    print("\nGenerating sample alert data...")

    print("  Sending humidity data for PIPE-001...")
    for i in range(3):
        result = send_humidity_data("PIPE-001", "东大街123号", 85 + i * 2)
        print(f"    Humidity {i+1}: {result.get('id', 'error')}")

    print("  Sending video data for PIPE-001...")
    result = send_video_data("PIPE-001", "东大街123号", 0.75)
    print(f"    Video: {result.get('id', 'error')}")

    print("  Sending manual data for PIPE-001...")
    result = send_manual_data("PIPE-001", "东大街123号", True, "high")
    print(f"    Manual: {result.get('id', 'error')}")

    print("\n  Sending humidity data for PIPE-002...")
    for i in range(2):
        result = send_humidity_data("PIPE-002", "西大街456号", 75 + i * 3)
        print(f"    Humidity {i+1}: {result.get('id', 'error')}")

    print("\nSample data generation complete!")


def process_data():
    print("\nProcessing incoming data...")
    response = requests.post(f"{BASE_URL}/alerts/process")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))


def get_alerts():
    print("\nGetting pending alerts...")
    response = requests.get(f"{BASE_URL}/alerts/")
    alerts = response.json()
    print(f"Found {len(alerts)} alerts:")
    for alert in alerts:
        print(f"  [{alert['alert_level'].upper()}] {alert['alert_key']} - {alert['location']}")
        print(f"    Score: {alert['alert_score']}, Evidence: {alert['evidence_count']}")
    return alerts


def get_review_summary(alert_id):
    print(f"\nGetting review summary for alert {alert_id}...")
    response = requests.get(
        f"{BASE_URL}/alerts/{alert_id}/review-summary",
        params={"format": "text"}
    )
    result = response.json()
    if "content" in result:
        print(result["content"])
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))


def recalculate_segment(segment_id):
    print(f"\nRecalculating segment {segment_id}...")
    response = requests.post(f"{BASE_URL}/alerts/recalculate/segment/{segment_id}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "segments":
            create_sample_segment()
        elif cmd == "data":
            generate_sample_alerts()
        elif cmd == "process":
            process_data()
        elif cmd == "alerts":
            get_alerts()
        elif cmd == "summary" and len(sys.argv) > 2:
            get_review_summary(int(sys.argv[2]))
        elif cmd == "recalc" and len(sys.argv) > 2:
            recalculate_segment(sys.argv[2])
        elif cmd == "all":
            create_sample_segment()
            generate_sample_alerts()
            process_data()
            alerts = get_alerts()
            if alerts:
                get_review_summary(alerts[0]['id'])
        else:
            print("Usage:")
            print("  python sample_data.py segments  - Create sample pipe segments")
            print("  python sample_data.py data      - Generate sample alert data")
            print("  python sample_data.py process   - Process pending data")
            print("  python sample_data.py alerts    - List pending alerts")
            print("  python sample_data.py summary <alert_id>  - Get review summary")
            print("  python sample_data.py recalc <segment_id> - Recalculate segment")
            print("  python sample_data.py all       - Run all sample operations")
    else:
        print("Usage: python sample_data.py [command]")
        print("Commands: segments, data, process, alerts, summary <id>, recalc <seg>, all")
