import numpy as np
import cv2
from pathlib import Path
from typing import Tuple, Optional, Dict, List, Any
import json
import hashlib

class CartridgeFeatureExtractor:
    def __init__(self, feature_type: str = "sift"):
        self.feature_type = feature_type.lower()
        
        if self.feature_type == "sift":
            self.detector = cv2.SIFT_create(nfeatures=2000)
        elif self.feature_type == "orb":
            self.detector = cv2.ORB_create(nfeatures=2000)
        elif self.feature_type == "akaze":
            self.detector = cv2.AKAZE_create()
        else:
            self.detector = cv2.SIFT_create(nfeatures=2000)
        
        self.flann_index_kdtree = 0
        self.flann_params = dict(algorithm=self.flann_index_kdtree, trees=5)
        self.search_params = dict(checks=50)
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        return blurred
    
    def detect_cartridge_circle(self, image: np.ndarray) -> Optional[Dict[str, float]]:
        gray = self.preprocess_image(image)
        
        height, width = gray.shape
        min_radius = min(height, width) // 8
        max_radius = min(height, width) // 2
        
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=max_radius,
            param1=50,
            param2=30,
            minRadius=min_radius,
            maxRadius=max_radius
        )
        
        if circles is None:
            blurred = cv2.medianBlur(gray, 5)
            circles = cv2.HoughCircles(
                blurred,
                cv2.HOUGH_GRADIENT,
                dp=1.5,
                minDist=max_radius,
                param1=30,
                param2=20,
                minRadius=min_radius,
                maxRadius=max_radius
            )
        
        if circles is not None:
            circles = np.uint16(np.around(circles))
            largest_idx = np.argmax(circles[0, :, 2])
            x, y, r = circles[0, largest_idx]
            
            return {
                "center_x": float(x),
                "center_y": float(y),
                "radius": float(r),
                "width": float(r * 2),
                "height": float(r * 2)
            }
        
        return None
    
    def detect_primer_region(self, image: np.ndarray, cartridge_circle: Optional[Dict] = None) -> Dict[str, float]:
        gray = self.preprocess_image(image)
        height, width = gray.shape
        
        if cartridge_circle:
            cx, cy, r = cartridge_circle["center_x"], cartridge_circle["center_y"], cartridge_circle["radius"]
            primer_radius_estimate = r * 0.25
            
            inner_gray = gray[
                max(0, int(cy - primer_radius_estimate * 2)):min(height, int(cy + primer_radius_estimate * 2)),
                max(0, int(cx - primer_radius_estimate * 2)):min(width, int(cx + primer_radius_estimate * 2))
            ]
            
            if inner_gray.size > 0:
                _, binary = cv2.threshold(inner_gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
                
                contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                if contours:
                    largest_contour = max(contours, key=cv2.contourArea)
                    M = cv2.moments(largest_contour)
                    
                    if M["m00"] > 0:
                        center_x = int(cx - primer_radius_estimate * 2) + int(M["m10"] / M["m00"])
                        center_y = int(cy - primer_radius_estimate * 2) + int(M["m01"] / M["m00"])
                        area = cv2.contourArea(largest_contour)
                        radius = np.sqrt(area / np.pi)
                        
                        return {
                            "center_x": float(center_x),
                            "center_y": float(center_y),
                            "radius": float(radius),
                            "width": float(radius * 2),
                            "height": float(radius * 2)
                        }
            
            return {
                "center_x": float(cx),
                "center_y": float(cy),
                "radius": float(primer_radius_estimate),
                "width": float(primer_radius_estimate * 2),
                "height": float(primer_radius_estimate * 2)
            }
        
        return {
            "center_x": float(width / 2),
            "center_y": float(height / 2),
            "radius": float(min(width, height) / 8),
            "width": float(min(width, height) / 4),
            "height": float(min(width, height) / 4)
        }
    
    def detect_firing_pin_hole(self, image: np.ndarray, primer_region: Dict) -> Optional[Dict[str, float]]:
        gray = self.preprocess_image(image)
        
        px, py, pr = primer_region["center_x"], primer_region["center_y"], primer_region["radius"]
        height, width = gray.shape
        
        roi_x1 = max(0, int(px - pr * 0.5))
        roi_x2 = min(width, int(px + pr * 0.5))
        roi_y1 = max(0, int(py - pr * 0.5))
        roi_y2 = min(height, int(py + pr * 0.5))
        
        roi = gray[roi_y1:roi_y2, roi_x1:roi_x2]
        
        if roi.size < 100:
            return None
        
        _, binary = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        kernel = np.ones((3, 3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            valid_contours = []
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 10 and area < (roi.shape[0] * roi.shape[1]) * 0.5:
                    valid_contours.append((cnt, area))
            
            if valid_contours:
                valid_contours.sort(key=lambda x: x[1], reverse=True)
                largest = valid_contours[0][0]
                
                M = cv2.moments(largest)
                if M["m00"] > 0:
                    center_x = roi_x1 + int(M["m10"] / M["m00"])
                    center_y = roi_y1 + int(M["m01"] / M["m00"])
                    area = cv2.contourArea(largest)
                    radius = np.sqrt(area / np.pi)
                    
                    return {
                        "center_x": float(center_x),
                        "center_y": float(center_y),
                        "radius": float(radius),
                        "width": float(radius * 2),
                        "height": float(radius * 2)
                    }
        
        return None
    
    def detect_ejector_mark(self, image: np.ndarray, cartridge_circle: Optional[Dict] = None) -> Optional[Dict[str, float]]:
        gray = self.preprocess_image(image)
        height, width = gray.shape
        
        if cartridge_circle:
            cx, cy, r = cartridge_circle["center_x"], cartridge_circle["center_y"], cartridge_circle["radius"]
            
            edge_mask = np.zeros_like(gray)
            cv2.circle(edge_mask, (int(cx), int(cy)), int(r * 0.95), 255, thickness=int(r * 0.1))
            
            edge_region = cv2.bitwise_and(gray, edge_mask)
            
            _, binary = cv2.threshold(edge_region, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            kernel = np.ones((5, 5), np.uint8)
            binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                valid_contours = []
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if area > 50:
                        rect = cv2.minAreaRect(cnt)
                        box = cv2.boxPoints(rect)
                        box = np.int0(box)
                        
                        center, (w, h), angle = rect
                        
                        valid_contours.append({
                            "center": center,
                            "width": w,
                            "height": h,
                            "angle": angle,
                            "area": area
                        })
                
                if valid_contours:
                    valid_contours.sort(key=lambda x: x["area"], reverse=True)
                    best = valid_contours[0]
                    
                    return {
                        "center_x": float(best["center"][0]),
                        "center_y": float(best["center"][1]),
                        "width": float(best["width"]),
                        "height": float(best["height"]),
                        "angle": float(best["angle"])
                    }
        
        return None
    
    def extract_features(self, image: np.ndarray, region: Optional[Dict] = None) -> Tuple[List[cv2.KeyPoint], np.ndarray]:
        gray = self.preprocess_image(image)
        
        if region:
            mask = np.zeros_like(gray, dtype=np.uint8)
            
            if "radius" in region and region["radius"] > 0:
                cv2.circle(mask, (int(region["center_x"]), int(region["center_y"])), 
                          int(region["radius"]), 255, -1)
            elif "width" in region and "height" in region:
                x1 = int(region["center_x"] - region["width"] / 2)
                y1 = int(region["center_y"] - region["height"] / 2)
                x2 = int(x1 + region["width"])
                y2 = int(y1 + region["height"])
                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
            
            if np.sum(mask) > 0:
                keypoints, descriptors = self.detector.detectAndCompute(gray, mask)
            else:
                keypoints, descriptors = self.detector.detectAndCompute(gray, None)
        else:
            keypoints, descriptors = self.detector.detectAndCompute(gray, None)
        
        if descriptors is None:
            descriptors = np.array([])
        
        return keypoints, descriptors
    
    def extract_all_features(self, image: np.ndarray) -> Dict[str, Any]:
        height, width = image.shape[:2]
        
        cartridge_circle = self.detect_cartridge_circle(image)
        
        primer_region = self.detect_primer_region(image, cartridge_circle)
        
        firing_pin_region = self.detect_firing_pin_hole(image, primer_region)
        
        ejector_region = self.detect_ejector_mark(image, cartridge_circle)
        
        primer_keypoints, primer_descriptors = self.extract_features(image, primer_region)
        
        if firing_pin_region:
            firing_pin_keypoints, firing_pin_descriptors = self.extract_features(image, firing_pin_region)
        else:
            firing_pin_keypoints, firing_pin_descriptors = [], np.array([])
        
        if ejector_region:
            ejector_keypoints, ejector_descriptors = self.extract_features(image, ejector_region)
        else:
            ejector_keypoints, ejector_descriptors = [], np.array([])
        
        extractor_keypoints, extractor_descriptors = self.extract_features(image, cartridge_circle)
        
        return {
            "image_width": width,
            "image_height": height,
            "cartridge_circle": cartridge_circle,
            "primer_region": primer_region,
            "firing_pin_region": firing_pin_region,
            "ejector_region": ejector_region,
            "primer": {
                "keypoints_count": len(primer_keypoints),
                "descriptors": primer_descriptors,
                "center_x": primer_region["center_x"],
                "center_y": primer_region["center_y"],
                "radius": primer_region["radius"]
            },
            "firing_pin": {
                "keypoints_count": len(firing_pin_keypoints),
                "descriptors": firing_pin_descriptors,
                "center_x": firing_pin_region["center_x"] if firing_pin_region else None,
                "center_y": firing_pin_region["center_y"] if firing_pin_region else None,
                "radius": firing_pin_region["radius"] if firing_pin_region else None
            },
            "ejector": {
                "keypoints_count": len(ejector_keypoints),
                "descriptors": ejector_descriptors,
                "center_x": ejector_region["center_x"] if ejector_region else None,
                "center_y": ejector_region["center_y"] if ejector_region else None,
                "angle": ejector_region["angle"] if ejector_region else None
            },
            "extractor": {
                "keypoints_count": len(extractor_keypoints),
                "descriptors": extractor_descriptors
            }
        }
    
    def save_descriptors(self, descriptors: np.ndarray, filepath: str) -> bool:
        try:
            if descriptors is None or len(descriptors) == 0:
                return False
            
            np.save(filepath, descriptors)
            return True
        except Exception:
            return False
    
    def load_descriptors(self, filepath: str) -> Optional[np.ndarray]:
        try:
            path = Path(filepath)
            if path.exists():
                return np.load(str(path))
            return None
        except Exception:
            return None
    
    def compute_image_hash(self, image: np.ndarray) -> str:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        resized = cv2.resize(gray, (9, 8), interpolation=cv2.INTER_AREA)
        
        diff = resized[:, 1:] > resized[:, :-1]
        
        hash_int = sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])
        
        return hashlib.sha256(str(hash_int).encode()).hexdigest()[:16]
    
    def create_thumbnail(self, image: np.ndarray, max_size: int = 256) -> np.ndarray:
        height, width = image.shape[:2]
        
        if height > width:
            new_height = max_size
            new_width = int(width * (max_size / height))
        else:
            new_width = max_size
            new_height = int(height * (max_size / width))
        
        return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
