import cv2
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from py_hand_tracking_sdk import (
    HandTracker, TrackerConfig, TrackingMode,
    Visualizer, PerformanceProfiler
)

def main():
    print(f"Hand Tracking SDK v{HandTracker.get_sdk_version()}")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Failed to open camera")
        return -1

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    config = TrackerConfig()
    config.mode = TrackingMode.MULTI_HAND
    config.max_num_hands = 2
    config.enable_gesture_recognition = True
    config.use_int8_quantization = True

    tracker = HandTracker()
    if not tracker.initialize(config):
        print("Failed to initialize tracker")
        return -1

    visualizer = Visualizer()
    profiler = PerformanceProfiler()

    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)

        profiler.start_frame()

        success, result = tracker.process_frame(frame)
        if success:
            fps = profiler.get_fps()
            frame = visualizer.draw_all(frame, result, fps)

            if frame_count % 30 == 0:
                print(f"Frame {frame_count}: {len(result.hands)} hands, "
                      f"FPS: {fps:.1f}, "
                      f"Inference: {result.inference_time_ms:.2f}ms")

                for i, hand in enumerate(result.hands):
                    print(f"  Hand {i+1}: {hand.gesture.name} "
                          f"({hand.gesture.confidence*100:.1f}%)")

        cv2.imshow("Hand Tracking Demo", frame)

        profiler.end_frame()
        frame_count += 1

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    tracker.release()

    return 0

if __name__ == "__main__":
    main()
