import numpy as np
import json
from typing import Dict, List, Optional
import os


SIGN_WORDS = [
    {"id": "hello", "word": "你好", "description": "右手平伸，掌心向下，左右摇动", "video_url": "/videos/hello.mp4"},
    {"id": "thank_you", "word": "谢谢", "description": "右手握拳，拇指伸直，轻点下唇，然后向外推出", "video_url": "/videos/thank_you.mp4"},
    {"id": "sorry", "word": "对不起", "description": "右手握拳，放在胸前，画圈", "video_url": "/videos/sorry.mp4"},
    {"id": "please", "word": "请", "description": "右手平伸，掌心向上，向前推出", "video_url": "/videos/please.mp4"},
    {"id": "good", "word": "好", "description": "右手握拳，拇指向上", "video_url": "/videos/good.mp4"},
    {"id": "bad", "word": "不好", "description": "右手握拳，拇指向下", "video_url": "/videos/bad.mp4"},
    {"id": "yes", "word": "是", "description": "右手握拳，拇指伸直，上下点动", "video_url": "/videos/yes.mp4"},
    {"id": "no", "word": "不是", "description": "右手五指并拢，左右摇动", "video_url": "/videos/no.mp4"},
    {"id": "want", "word": "要", "description": "右手平伸，掌心向上，向内收回", "video_url": "/videos/want.mp4"},
    {"id": "dont_want", "word": "不要", "description": "右手平伸，掌心向上，向外推出", "video_url": "/videos/dont_want.mp4"},
    {"id": "i", "word": "我", "description": "右手指向自己", "video_url": "/videos/i.mp4"},
    {"id": "you", "word": "你", "description": "右手指向对方", "video_url": "/videos/you.mp4"},
    {"id": "he", "word": "他", "description": "右手指向侧面", "video_url": "/videos/he.mp4"},
    {"id": "like", "word": "喜欢", "description": "右手握拳，拇指轻抚胸口", "video_url": "/videos/like.mp4"},
    {"id": "help", "word": "帮助", "description": "左手握拳，右手拍左拳", "video_url": "/videos/help.mp4"},
    {"id": "learn", "word": "学习", "description": "双手平放，掌心向下，翻转向上", "video_url": "/videos/learn.mp4"},
    {"id": "work", "word": "工作", "description": "双手握拳，交替上下敲击", "video_url": "/videos/work.mp4"},
    {"id": "eat", "word": "吃饭", "description": "右手做拿筷子吃饭的动作", "video_url": "/videos/eat.mp4"},
    {"id": "drink", "word": "喝水", "description": "右手做拿杯子喝水的动作", "video_url": "/videos/drink.mp4"},
    {"id": "goodbye", "word": "再见", "description": "右手平伸，五指张开，左右摇动", "video_url": "/videos/goodbye.mp4"}
]


class TemplateGenerator:
    def __init__(self):
        self.templates: Dict[str, List] = {}

    def generate_synthetic_template(self, word: str, num_frames: int = 30) -> List[List[dict]]:
        np.random.seed(hash(word) % 2**32)

        all_landmarks = []

        base_landmarks = [
            (0.5, 0.7, 0.0),
            (0.45, 0.6, -0.1),
            (0.4, 0.5, -0.15),
            (0.35, 0.42, -0.18),
            (0.3, 0.35, -0.2),
            (0.5, 0.45, -0.05),
            (0.48, 0.3, -0.08),
            (0.46, 0.2, -0.1),
            (0.44, 0.12, -0.12),
            (0.55, 0.45, -0.05),
            (0.56, 0.28, -0.08),
            (0.57, 0.18, -0.1),
            (0.58, 0.1, -0.12),
            (0.6, 0.48, -0.05),
            (0.62, 0.32, -0.08),
            (0.64, 0.22, -0.1),
            (0.66, 0.14, -0.12),
            (0.63, 0.55, -0.05),
            (0.65, 0.42, -0.08),
            (0.67, 0.35, -0.1),
            (0.68, 0.28, -0.12)
        ]

        for frame_idx in range(num_frames):
            progress = frame_idx / (num_frames - 1) if num_frames > 1 else 0

            frame_landmarks = []
            for i, (bx, by, bz) in enumerate(base_landmarks):
                variation = 0.05 * np.sin(progress * np.pi * 2 + i * 0.5)
                x = bx + variation * 0.3
                y = by + 0.1 * np.sin(progress * np.pi * 3 + i * 0.3)
                z = bz + 0.05 * np.cos(progress * np.pi * 2 + i * 0.4)

                frame_landmarks.append({
                    "x": round(x + np.random.normal(0, 0.005), 6),
                    "y": round(y + np.random.normal(0, 0.005), 6),
                    "z": round(z + np.random.normal(0, 0.005), 6)
                })

            all_landmarks.append(frame_landmarks)

        return all_landmarks

    def generate_all_templates(self, output_dir: str = "./data/templates") -> Dict[str, List]:
        os.makedirs(output_dir, exist_ok=True)

        templates = {}
        for sign in SIGN_WORDS:
            word_id = sign["id"]
            word = sign["word"]

            landmarks = self.generate_synthetic_template(word)
            templates[word_id] = {
                "word": word,
                "description": sign["description"],
                "video_url": sign["video_url"],
                "landmarks": landmarks
            }

            template_path = os.path.join(output_dir, f"{word_id}.json")
            with open(template_path, "w", encoding="utf-8") as f:
                json.dump(templates[word_id], f, ensure_ascii=False, indent=2)

        return templates

    def get_sign_words_list(self) -> List[dict]:
        return [
            {"id": s["id"], "word": s["word"], "description": s["description"], "video_url": s["video_url"]}
            for s in SIGN_WORDS
        ]


def load_template_from_file(file_path: str) -> Optional[List[List[dict]]]:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("landmarks", [])
    except Exception:
        return None


def landmarks_to_array(landmarks_list: List[List[dict]]) -> np.ndarray:
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
