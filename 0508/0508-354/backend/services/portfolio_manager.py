import os
import json
import time
import base64
from datetime import datetime
import uuid


class PortfolioManager:
    def __init__(self, storage_dir="portfolio_data"):
        self.storage_dir = storage_dir
        self.data_file = os.path.join(storage_dir, "portfolio.json")
        self.images_dir = os.path.join(storage_dir, "images")
        
        self._ensure_directories()
        self._initialize_data()

    def _ensure_directories(self):
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)

    def _initialize_data(self):
        if not os.path.exists(self.data_file):
            initial_data = {
                "works": []
            }
            self._save_data(initial_data)

    def _load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"works": []}

    def _save_data(self, data):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _save_image(self, image_base64, work_id):
        image_bytes = base64.b64decode(image_base64)
        image_filename = f"{work_id}.png"
        image_path = os.path.join(self.images_dir, image_filename)
        
        with open(image_path, 'wb') as f:
            f.write(image_bytes)
        
        return image_filename

    def _load_image(self, image_filename):
        image_path = os.path.join(self.images_dir, image_filename)
        if os.path.exists(image_path):
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
                return base64.b64encode(image_bytes).decode('utf-8')
        return None

    def save_work(self, user_image, reference_image, character, font, scores, 
                  overlay_image=None, difference_regions=None):
        work_id = str(uuid.uuid4())
        timestamp = time.time()
        
        user_image_filename = self._save_image(user_image, f"{work_id}_user")
        
        ref_image_filename = self._save_image(reference_image, f"{work_id}_ref")
        
        overlay_filename = None
        if overlay_image:
            overlay_filename = self._save_image(overlay_image, f"{work_id}_overlay")
        
        work = {
            "id": work_id,
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S'),
            "character": character,
            "font": font,
            "user_image": user_image_filename,
            "reference_image": ref_image_filename,
            "overlay_image": overlay_filename,
            "scores": scores,
            "difference_regions": difference_regions or []
        }
        
        data = self._load_data()
        data["works"].insert(0, work)
        
        if len(data["works"]) > 100:
            old_works = data["works"][100:]
            for old_work in old_works:
                self._delete_work_images(old_work)
            data["works"] = data["works"][:100]
        
        self._save_data(data)
        
        return work

    def get_all_works(self, character=None, font=None, limit=100):
        data = self._load_data()
        works = data["works"]
        
        if character:
            works = [w for w in works if w["character"] == character]
        
        if font:
            works = [w for w in works if w["font"] == font]
        
        works = works[:limit]
        
        for work in works:
            if "user_image" in work and isinstance(work["user_image"], str):
                if work["user_image"].endswith('.png'):
                    work["user_image_data"] = self._load_image(work["user_image"])
                else:
                    work["user_image_data"] = work["user_image"]
            
            if "reference_image" in work and isinstance(work["reference_image"], str):
                if work["reference_image"].endswith('.png'):
                    work["reference_image_data"] = self._load_image(work["reference_image"])
                else:
                    work["reference_image_data"] = work["reference_image"]
            
            if "overlay_image" in work and work["overlay_image"]:
                if isinstance(work["overlay_image"], str) and work["overlay_image"].endswith('.png'):
                    work["overlay_image_data"] = self._load_image(work["overlay_image"])
                else:
                    work["overlay_image_data"] = work["overlay_image"]
        
        return works

    def get_work_by_id(self, work_id):
        data = self._load_data()
        for work in data["works"]:
            if work["id"] == work_id:
                if "user_image" in work and isinstance(work["user_image"], str):
                    if work["user_image"].endswith('.png'):
                        work["user_image_data"] = self._load_image(work["user_image"])
                    else:
                        work["user_image_data"] = work["user_image"]
                
                if "reference_image" in work and isinstance(work["reference_image"], str):
                    if work["reference_image"].endswith('.png'):
                        work["reference_image_data"] = self._load_image(work["reference_image"])
                    else:
                        work["reference_image_data"] = work["reference_image"]
                
                if "overlay_image" in work and work["overlay_image"]:
                    if isinstance(work["overlay_image"], str) and work["overlay_image"].endswith('.png'):
                        work["overlay_image_data"] = self._load_image(work["overlay_image"])
                    else:
                        work["overlay_image_data"] = work["overlay_image"]
                
                return work
        return None

    def delete_work(self, work_id):
        data = self._load_data()
        for i, work in enumerate(data["works"]):
            if work["id"] == work_id:
                self._delete_work_images(work)
                del data["works"][i]
                self._save_data(data)
                return True
        return False

    def _delete_work_images(self, work):
        for key in ["user_image", "reference_image", "overlay_image"]:
            filename = work.get(key)
            if filename and isinstance(filename, str) and filename.endswith('.png'):
                filepath = os.path.join(self.images_dir, filename)
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except:
                        pass

    def clear_all_works(self):
        data = self._load_data()
        for work in data["works"]:
            self._delete_work_images(work)
        
        self._save_data({"works": []})
        return True

    def get_statistics(self):
        data = self._load_data()
        works = data["works"]
        
        if not works:
            return {
                "total_works": 0,
                "avg_score": 0,
                "characters_practiced": [],
                "practice_days": 0
            }
        
        scores = [w["scores"].get("score", 0) for w in works if "scores" in w]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        characters = list(set(w["character"] for w in works))
        
        dates = list(set(datetime.fromtimestamp(w["timestamp"]).strftime('%Y-%m-%d') for w in works))
        
        return {
            "total_works": len(works),
            "avg_score": round(avg_score, 1),
            "characters_practiced": characters,
            "practice_days": len(dates),
            "recent_scores": scores[:10]
        }

    def get_character_history(self, character):
        works = self.get_all_works(character=character)
        
        if not works:
            return []
        
        history = []
        for work in works:
            history.append({
                "id": work["id"],
                "timestamp": work["timestamp"],
                "datetime": work["datetime"],
                "score": work["scores"].get("score", 0),
                "font": work["font"],
                "character": work["character"]
            })
        
        return sorted(history, key=lambda x: x["timestamp"])
