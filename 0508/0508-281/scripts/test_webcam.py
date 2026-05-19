#!/usr/bin/env python3
import cv2
import time
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.models.yolov5_trt import YOLOv5TRT
from backend.tracking.deepsort import DeepSORT


def test_webcam(camera_id=0):
    print("=" * 50)
    print("摄像头实时检测测试")
    print("按 'q' 退出")
    print("=" * 50)
    
    detector = YOLOv5TRT("config/config.yaml")
    tracker = DeepSORT("config/config.yaml")
    
    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        print(f"无法打开摄像头 {camera_id}")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    frame_count = 0
    start_time = time.time()
    colors = {}
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("无法读取帧")
                break
            
            frame_count += 1
            
            detections = detector.detect_batch([frame])[0]
            tracker.predict()
            tracked_objects = tracker.update(detections)
            
            for obj in tracked_objects:
                track_id = obj['track_id']
                if track_id not in colors:
                    colors[track_id] = (
                        int(hash(track_id) % 256),
                        int(hash(track_id * 2) % 256),
                        int(hash(track_id * 3) % 256)
                    )
                
                color = colors[track_id]
                x1, y1, x2, y2 = obj['bbox']
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                label = f"#{track_id} {obj['class_name']} {obj['confidence']:.2f}"
                cv2.putText(frame, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            elapsed = time.time() - start_time
            fps = frame_count / elapsed
            
            cv2.putText(frame, f"FPS: {fps:.1f}", (20, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"Tracks: {len(tracked_objects)}", (20, 80),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.imshow('Object Detection & Tracking', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    except KeyboardInterrupt:
        pass
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
        total_time = time.time() - start_time
        print(f"\n总计: {frame_count} 帧, {total_time:.2f} 秒")
        print(f"平均 FPS: {frame_count / total_time:.2f}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='摄像头实时检测测试')
    parser.add_argument('--camera', type=int, default=0, help='摄像头ID')
    
    args = parser.parse_args()
    test_webcam(args.camera)
