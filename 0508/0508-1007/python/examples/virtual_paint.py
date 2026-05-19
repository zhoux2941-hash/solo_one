import cv2
import numpy as np
import sys
import os
from collections import deque

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from py_hand_tracking_sdk import (
    HandTracker, TrackerConfig, TrackingMode,
    Visualizer, PerformanceProfiler, GestureType
)

class PaintStroke:
    def __init__(self, color, thickness):
        self.points = deque()
        self.color = color
        self.thickness = thickness

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Failed to open camera")
        return -1

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    config = TrackerConfig()
    config.mode = TrackingMode.SINGLE_HAND
    config.max_num_hands = 1
    config.enable_gesture_recognition = True

    tracker = HandTracker()
    if not tracker.initialize(config):
        print("Failed to initialize tracker")
        return -1

    visualizer = Visualizer()
    profiler = PerformanceProfiler()

    colors = [
        (255, 0, 0),
        (0, 255, 0),
        (0, 0, 255),
        (255, 255, 0),
        (255, 0, 255),
        (0, 255, 255)
    ]
    current_color_idx = 0
    current_thickness = 5

    strokes = []
    current_stroke = None
    is_drawing = False

    canvas = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]

        if canvas is None or canvas.shape != frame.shape:
            canvas = np.ones_like(frame) * 255

        profiler.start_frame()

        success, result = tracker.process_frame(frame)
        if success:
            if result.hands:
                hand = result.hands[0]
                index_tip = hand.landmarks[8].position
                middle_tip = hand.landmarks[12].position

                x = int(index_tip.x * w)
                y = int(index_tip.y * h)

                dx = index_tip.x - middle_tip.x
                dy = index_tip.y - middle_tip.y
                distance = np.sqrt(dx*dx + dy*dy)

                gesture = hand.gesture.type

                if gesture == GestureType.TWO and distance < 0.08:
                    if is_drawing and current_stroke and current_stroke.points:
                        strokes.append(current_stroke)
                    current_stroke = None
                    is_drawing = False
                elif gesture == GestureType.ONE:
                    is_drawing = True
                    if current_stroke is None:
                        current_stroke = PaintStroke(colors[current_color_idx], current_thickness)
                    current_stroke.points.append((x, y))
                elif gesture == GestureType.FIST:
                    if strokes:
                        strokes.pop()
                    current_stroke = None
                    is_drawing = False
                elif gesture == GestureType.THREE:
                    current_color_idx = (current_color_idx + 1) % len(colors)
                elif gesture == GestureType.FOUR:
                    current_thickness = max(2, current_thickness - 1)
                elif gesture == GestureType.FIVE:
                    current_thickness = min(20, current_thickness + 1)
                else:
                    if is_drawing and current_stroke and current_stroke.points:
                        strokes.append(current_stroke)
                    current_stroke = None
                    is_drawing = False

                if is_drawing:
                    cv2.circle(frame, (x, y), current_thickness + 3,
                               colors[current_color_idx], -1)

            fps = profiler.get_fps()
            frame = visualizer.draw_all(frame, result, fps)

        canvas[:] = 255

        for stroke in strokes:
            points = list(stroke.points)
            for i in range(1, len(points)):
                cv2.line(canvas, points[i-1], points[i],
                         stroke.color, stroke.thickness, cv2.LINE_AA)

        if current_stroke:
            points = list(current_stroke.points)
            for i in range(1, len(points)):
                cv2.line(canvas, points[i-1], points[i],
                         current_stroke.color, current_stroke.thickness, cv2.LINE_AA)

        display = cv2.addWeighted(frame, 0.6, canvas, 0.4, 0)

        cv2.putText(display, f"Color: {current_color_idx + 1}/{len(colors)}",
                    (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.putText(display, f"Thickness: {current_thickness}",
                    (10, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.putText(display, "1=Draw | 2=Select | Fist=Undo | 3=Color | 4/5=Thickness",
                    (10, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        cv2.imshow("Virtual Paint", display)

        profiler.end_frame()

        key = cv2.waitKey(1) & 0xFF
        if key == 27:
            break
        if key == ord('c'):
            strokes.clear()
            current_stroke = None
        if key == ord('s'):
            cv2.imwrite("painting.png", canvas)
            print("Saved painting to painting.png")

    cap.release()
    cv2.destroyAllWindows()
    tracker.release()

    return 0

if __name__ == "__main__":
    main()
