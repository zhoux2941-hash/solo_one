#!/usr/bin/env python3
"""
追踪器稳定性测试脚本
测试ID切换频率
"""
import cv2
import numpy as np
import sys
import os
from collections import defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.tracking.deepsort import DeepSORT
from backend.tracking.kalman_filter import KalmanBoxTracker


def generate_mock_detections(frame_num, num_objects=2):
    """生成模拟的检测结果，模拟物体移动
    detections = []
    
    for obj_id in range(num_objects):
        base_x = 100 + obj_id * 200 + frame_num * 2
        base_y = 150 + np.sin(frame_num * 0.1) * 30
        w = 80 + np.sin(frame_num * 0.05) * 10
        h = 120
        
        detections.append({
            'bbox': [base_x, base_y, base_x + w, base_y + h],
            'confidence': 0.85,
            'class_id': 0,
            'class_name': 'person'
        })
    
    if frame_num % 10 == 0:
        if len(detections) > 0:
            detections.pop(0)
    
    return detections


def test_tracking_stability():
    print("=" * 60)
    print("追踪器稳定性测试")
    print("=" * 60)
    
    tracker = DeepSORT(os.path.join(os.path.dirname(__file__), '..', 'config', 'config.yaml'))
    
    id_history = defaultdict(list)
    frame_count = 100
    id_changes = 0
    prev_ids = set()
    
    print(f"\n运行 {frame_count} 帧模拟测试...")
    
    for frame in range(frame_count):
        detections = generate_mock_detections(frame)
        
        tracker.predict()
        tracked_objects = tracker.update(detections)
        
        current_ids = set([obj['track_id'] for obj in tracked_objects])
        
        if frame > 0 and len(prev_ids) > 0 and len(current_ids) > 0:
            new_ids = current_ids - prev_ids
            if len(new_ids) > 0:
                id_changes += len(new_ids)
        
        for obj_id in current_ids:
            id_history[obj_id].append(frame)
        
        prev_ids = current_ids.copy()
        
        if (frame + 1) % 20 == 0:
            print(f"  帧 {frame+1}: 追踪到 {len(current_ids)} 个目标, ID: {sorted(current_ids)}")
    
    print("\n" + "=" * 60)
    print("测试结果:")
    print(f"  总帧数: {frame_count}")
    print(f"  使用的唯一ID数量: {len(id_history)}")
    print(f"  ID切换次数: {id_changes}")
    
    if id_history:
        avg_lifespan = np.mean([len(frames) for frames in id_history.values()])
        print(f"  平均轨迹寿命: {avg_lifespan:.1f} 帧")
        
        max_lifespan = max([len(frames) for frames in id_history.values()])
        print(f"  最长轨迹寿命: {max_lifespan} 帧")
    
    if len(id_history) <= 3 and id_changes <= 5:
        print("\n✅ 追踪稳定性良好!")
    else:
        print("\n⚠️  需要进一步优化追踪参数")
    print("=" * 60)


def test_iou_matching():
    """测试IOU匹配的鲁棒性"""
    print("\nIOU匹配测试:")
    
    bbox1 = [100, 100, 200, 200]
    bbox2 = [105, 105, 205, 205]
    
    tracker = DeepSORT(os.path.join(os.path.dirname(__file__), '..', 'config', 'config.yaml'))
    
    iou = tracker._iou(bbox1, bbox2)
    print(f"  轻微偏移的IOU: {iou:.3f}")
    
    dets = [{'bbox': bbox1, 'confidence': 0.9, 'class_id': 0, 'class_name': 'person'}]
    
    tracker.predict()
    results = tracker.update(dets)
    track_id = results[0]['track_id']
    
    for i in range(5):
        shifted_bbox = [100 + i*5, 100 + i*3, 200 + i*5, 200 + i*3]
        dets = [{'bbox': shifted_bbox, 'confidence': 0.9, 'class_id': 0, 'class_name': 'person'}]
        tracker.predict()
        results = tracker.update(dets)
        if len(results) > 0:
            print(f"  帧 {i+1}: ID = {results[0]['track_id']}")
    
    print(f"  ID一致性: {'稳定 = {track_id}")


if __name__ == '__main__':
    test_tracking_stability()
    test_iou_matching()
