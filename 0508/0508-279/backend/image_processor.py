import cv2
import pytesseract
import numpy as np
from typing import List, Dict, Tuple
import os
from PIL import Image, ImageEnhance, ImageFilter

class ImageProcessor:
    def __init__(self):
        self.object_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        self.object_labels = {
            'person': '人物',
            'car': '汽车',
            'building': '建筑',
            'tree': '树木',
            'tourist': '游客'
        }
        
        self.tesseract_configs = [
            r'--oem 3 --psm 6 -l chi_sim+eng',
            r'--oem 3 --psm 3 -l chi_sim+eng',
            r'--oem 3 --psm 11 -l chi_sim+eng',
            r'--oem 1 --psm 6 -l chi_sim+eng'
        ]
    
    def _upscale_image(self, img: np.ndarray, scale: float = 2.0) -> np.ndarray:
        height, width = img.shape[:2]
        if height < 300 or width < 300:
            return cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        return img
    
    def _denoise_image(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            denoised = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
        else:
            denoised = cv2.fastNlMeansDenoising(img, None, 10, 7, 21)
        return denoised
    
    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            lab = cv2.merge((l, a, b))
            return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            return clahe.apply(img)
    
    def _sharpen_image(self, img: np.ndarray) -> np.ndarray:
        kernel = np.array([
            [-1, -1, -1],
            [-1,  9, -1],
            [-1, -1, -1]
        ])
        return cv2.filter2D(img, -1, kernel)
    
    def _adaptive_threshold(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        return thresh
    
    def _otsu_threshold(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh
    
    def _morphology_operations(self, img: np.ndarray) -> np.ndarray:
        kernel = np.ones((2, 2), np.uint8)
        opening = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel, iterations=1)
        closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel, iterations=1)
        return closing
    
    def _deskew_image(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        
        coords = np.column_stack(np.where(gray > 0))
        if len(coords) < 100:
            return img
        
        angle = cv2.minAreaRect(coords)[-1]
        
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        if abs(angle) < 0.5:
            return img
        
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        return rotated
    
    def _remove_shadows(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            rgb_planes = cv2.split(img)
            result_planes = []
            for plane in rgb_planes:
                dilated_img = cv2.dilate(plane, np.ones((7, 7), np.uint8))
                bg_img = cv2.medianBlur(dilated_img, 21)
                diff_img = 255 - cv2.absdiff(plane, bg_img)
                norm_img = cv2.normalize(diff_img, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
                result_planes.append(norm_img)
            return cv2.merge(result_planes)
        return img
    
    def _pil_enhance(self, img: np.ndarray) -> np.ndarray:
        pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        
        enhancer = ImageEnhance.Contrast(pil_img)
        pil_img = enhancer.enhance(1.5)
        
        enhancer = ImageEnhance.Sharpness(pil_img)
        pil_img = enhancer.enhance(2.0)
        
        enhancer = ImageEnhance.Brightness(pil_img)
        pil_img = enhancer.enhance(1.1)
        
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    
    def _bilateral_filter(self, img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            return cv2.bilateralFilter(img, 9, 75, 75)
        return img
    
    def _generate_preprocessing_variants(self, img: np.ndarray) -> List[np.ndarray]:
        variants = []
        
        variants.append(img)
        
        upscaled = self._upscale_image(img, 2.0)
        variants.append(upscaled)
        
        upscaled_3x = self._upscale_image(img, 3.0)
        variants.append(upscaled_3x)
        
        bilateral = self._bilateral_filter(upscaled)
        variants.append(bilateral)
        
        denoised = self._denoise_image(upscaled)
        variants.append(denoised)
        
        pil_enhanced = self._pil_enhance(upscaled)
        variants.append(pil_enhanced)
        
        contrast_enhanced = self._enhance_contrast(denoised)
        variants.append(contrast_enhanced)
        
        sharpened = self._sharpen_image(contrast_enhanced)
        variants.append(sharpened)
        
        deshadowed = self._remove_shadows(sharpened)
        variants.append(deshadowed)
        
        deskewed = self._deskew_image(deshadowed)
        variants.append(deskewed)
        
        if len(deskewed.shape) == 3:
            gray = cv2.cvtColor(deskewed, cv2.COLOR_BGR2GRAY)
        else:
            gray = deskewed
        
        adaptive_thresh = self._adaptive_threshold(gray)
        variants.append(adaptive_thresh)
        
        otsu_thresh = self._otsu_threshold(gray)
        variants.append(otsu_thresh)
        
        morphed = self._morphology_operations(otsu_thresh)
        variants.append(morphed)
        
        inverted = cv2.bitwise_not(otsu_thresh)
        variants.append(inverted)
        
        return variants
    
    def _calculate_text_confidence(self, text: str) -> float:
        if not text:
            return 0.0
        
        text_len = len(text.strip())
        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        english_chars = sum(1 for c in text if c.isalpha() and c.isascii())
        digits = sum(1 for c in text if c.isdigit())
        
        meaningful_chars = chinese_chars + english_chars + digits
        
        if text_len > 0:
            return meaningful_chars / text_len
        return 0.0
    
    def extract_text(self, image_path: str) -> str:
        try:
            img = cv2.imread(image_path)
            if img is None:
                return ""
            
            variants = self._generate_preprocessing_variants(img)
            
            best_text = ""
            best_confidence = 0.0
            
            for variant in variants:
                for config in self.tesseract_configs:
                    try:
                        text = pytesseract.image_to_string(variant, config=config)
                        confidence = self._calculate_text_confidence(text)
                        
                        if confidence > best_confidence and len(text.strip()) > len(best_text.strip()):
                            best_text = text
                            best_confidence = confidence
                    except:
                        continue
            
            if not best_text.strip():
                for variant in variants:
                    try:
                        text = pytesseract.image_to_string(variant, lang='chi_sim+eng')
                        if len(text.strip()) > len(best_text.strip()):
                            best_text = text
                    except:
                        continue
            
            return best_text.strip()
        except Exception as e:
            print(f"OCR Error: {e}")
            try:
                img = cv2.imread(image_path)
                if img is not None:
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    return pytesseract.image_to_string(gray, lang='chi_sim+eng').strip()
            except:
                pass
            return ""
    
    def detect_objects(self, image_path: str) -> List[Dict]:
        detected_objects = []
        
        try:
            img = cv2.imread(image_path)
            if img is None:
                return detected_objects
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            faces = self.object_cascade.detectMultiScale(gray, 1.1, 4)
            for (x, y, w, h) in faces:
                detected_objects.append({
                    'type': 'person',
                    'label': '人物',
                    'confidence': 0.85,
                    'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
                })
            
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            lower_blue = np.array([100, 50, 50])
            upper_blue = np.array([130, 255, 255])
            blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
            blue_contours, _ = cv2.findContours(blue_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in blue_contours:
                if cv2.contourArea(contour) > 500:
                    x, y, w, h = cv2.boundingRect(contour)
                    detected_objects.append({
                        'type': 'building',
                        'label': '建筑',
                        'confidence': 0.75,
                        'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
                    })
            
            lower_green = np.array([35, 50, 50])
            upper_green = np.array([85, 255, 255])
            green_mask = cv2.inRange(hsv, lower_green, upper_green)
            green_contours, _ = cv2.findContours(green_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in green_contours:
                if cv2.contourArea(contour) > 300:
                    x, y, w, h = cv2.boundingRect(contour)
                    detected_objects.append({
                        'type': 'tree',
                        'label': '树木',
                        'confidence': 0.7,
                        'bbox': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
                    })
            
            if len(detected_objects) > 0:
                detected_objects.append({
                    'type': 'tourist',
                    'label': '游客',
                    'confidence': 0.8,
                    'bbox': {'x': 0, 'y': 0, 'w': 0, 'h': 0}
                })
            
            return detected_objects
            
        except Exception as e:
            print(f"Object Detection Error: {e}")
            return detected_objects
    
    def extract_entities_from_text(self, text: str) -> List[Dict]:
        entities = []
        
        location_keywords = ['长城', '北京', '上海', '故宫', '天安门', '西湖', '黄山', '西安', '成都', '重庆']
        for keyword in location_keywords:
            if keyword in text:
                entities.append({
                    'name': keyword,
                    'type': 'LOC',
                    'label': '地名',
                    'source': 'ocr'
                })
        
        person_keywords = ['张三', '李四', '王五', '小明', '小红']
        for keyword in person_keywords:
            if keyword in text:
                entities.append({
                    'name': keyword,
                    'type': 'PER',
                    'label': '人名',
                    'source': 'ocr'
                })
        
        org_keywords = ['公司', '大学', '医院', '政府', '学校', '研究院']
        for keyword in org_keywords:
            if keyword in text:
                entities.append({
                    'name': keyword,
                    'type': 'ORG',
                    'label': '组织名',
                    'source': 'ocr'
                })
        
        return entities
    
    def process_image(self, image_path: str, image_id: str) -> Dict:
        text = self.extract_text(image_path)
        objects = self.detect_objects(image_path)
        text_entities = self.extract_entities_from_text(text)
        
        object_entities = []
        for obj in objects:
            object_entities.append({
                'name': obj['label'],
                'type': 'OBJECT',
                'label': obj['label'],
                'object_type': obj['type'],
                'confidence': obj['confidence'],
                'source': 'object_detection'
            })
        
        all_entities = text_entities + object_entities
        
        return {
            'image_id': image_id,
            'image_path': image_path,
            'extracted_text': text,
            'detected_objects': objects,
            'entities': all_entities,
            'relations': self._extract_relations(all_entities)
        }
    
    def _extract_relations(self, entities: List[Dict]) -> List[Dict]:
        relations = []
        
        loc_entities = [e for e in entities if e['type'] == 'LOC']
        obj_entities = [e for e in entities if e['type'] == 'OBJECT']
        
        for loc in loc_entities:
            for obj in obj_entities:
                relations.append({
                    'source': loc['name'],
                    'target': obj['name'],
                    'relation': '包含',
                    'source_type': loc['type'],
                    'target_type': obj['type']
                })
        
        return relations
    
    def create_thumbnail(self, image_path: str, output_path: str, size: Tuple[int, int] = (200, 200)):
        try:
            with Image.open(image_path) as img:
                img.thumbnail(size)
                img.save(output_path)
            return True
        except Exception as e:
            print(f"Thumbnail Error: {e}")
            return False
