import cv2
import numpy as np
import json
from typing import List, Tuple, Optional
import mediapipe as mp


class HandLandmarkExtractor:
    def __init__(self, static_image_mode=False, min_detection_confidence=0.7, min_tracking_confidence=0.5):
        self.mp_hands = mp.solutions.hands
        self.mp_draw = mp.solutions.drawing_utils
        self.mp_draw_styles = mp.solutions.drawing_styles

        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )

    def extract_landmarks_from_video(self, video_path: str) -> Optional[List[List[dict]]]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None

        all_landmarks = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    frame_landmarks = []
                    for landmark in hand_landmarks.landmark:
                        frame_landmarks.append({
                            "x": float(landmark.x),
                            "y": float(landmark.y),
                            "z": float(landmark.z)
                        })
                    all_landmarks.append(frame_landmarks)
            else:
                all_landmarks.append([])

            frame_count += 1

        cap.release()
        return all_landmarks

    def extract_landmarks_from_frames(self, frames: List[np.ndarray]) -> List[List[dict]]:
        all_landmarks = []

        for frame in frames:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    frame_landmarks = []
                    for landmark in hand_landmarks.landmark:
                        frame_landmarks.append({
                            "x": float(landmark.x),
                            "y": float(landmark.y),
                            "z": float(landmark.z)
                        })
                    all_landmarks.append(frame_landmarks)
            else:
                all_landmarks.append([])

        return all_landmarks

    def landmarks_to_array(self, landmarks_list: List[List[dict]]) -> np.ndarray:
        if not landmarks_list:
            return np.array([])

        filtered = [l for l in landmarks_list if len(l) == 21]
        if not filtered:
            return np.array([])

        frames = []
        for frame_data in filtered:
            frame_points = []
            for point in frame_data:
                frame_points.extend([point["x"], point["y"], point["z"]])
            frames.append(frame_points)

        return np.array(frames)

    def close(self):
        self.hands.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
