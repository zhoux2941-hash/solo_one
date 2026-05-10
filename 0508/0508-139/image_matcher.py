import cv2
import numpy as np
from datetime import datetime
import os


class WearComparator:
    def __init__(self):
        self.sift = cv2.SIFT_create(nfeatures=5000, contrastThreshold=0.03)
        self.flann = cv2.FlannBasedMatcher(
            {'algorithm': 1, 'trees': 5},
            {'checks': 50}
        )
    
    def load_image(self, path, max_size=1600):
        if not path or not os.path.exists(path):
            return None, f"图片不存在: {path}"
        
        try:
            img = cv2.imread(path, cv2.IMREAD_COLOR)
            if img is None:
                return None, "无法读取图片格式"
            
            h, w = img.shape[:2]
            if max(h, w) > max_size:
                scale = max_size / max(h, w)
                img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            
            return img, None
        except Exception as e:
            return None, f"加载图片失败: {str(e)}"
    
    def extract_features(self, image):
        if image is None:
            return None, None, "图片为空"
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            keypoints, descriptors = self.sift.detectAndCompute(gray, None)
            
            if descriptors is None or len(keypoints) < 10:
                return None, None, "特征点不足，无法匹配"
            
            return keypoints, descriptors, None
        except Exception as e:
            return None, None, f"特征提取失败: {str(e)}"
    
    def match_features(self, desc1, desc2, ratio_threshold=0.75):
        if desc1 is None or desc2 is None:
            return None, "描述符为空"
        
        try:
            if len(desc1) < 2 or len(desc2) < 2:
                return None, "描述符数量不足"
            
            matches = self.flann.knnMatch(desc1, desc2, k=2)
            
            good_matches = []
            for m, n in matches:
                if m.distance < ratio_threshold * n.distance:
                    good_matches.append(m)
            
            if len(good_matches) < 10:
                return None, f"有效匹配点不足: {len(good_matches)}/10"
            
            return good_matches, None
        except Exception as e:
            return None, f"特征匹配失败: {str(e)}"
    
    def align_images(self, img1, img2, kp1, kp2, matches):
        if len(matches) < 10:
            return None, "匹配点不足"
        
        try:
            src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
            
            H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            
            if H is None:
                return None, "无法计算变换矩阵"
            
            h, w = img2.shape[:2]
            aligned_img1 = cv2.warpPerspective(img1, H, (w, h), flags=cv2.INTER_LINEAR)
            
            inliers = mask.ravel().sum()
            if inliers < len(matches) * 0.3:
                return aligned_img1, f"匹配质量一般（内点率: {inliers}/{len(matches)}）"
            
            return aligned_img1, None
        except Exception as e:
            return None, f"图像对齐失败: {str(e)}"
    
    def preprocess_for_diff(self, image):
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        return cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
    
    def detect_scratches(self, base_img, new_img, threshold=30, min_area=50):
        if base_img.shape != new_img.shape:
            h, w = base_img.shape[:2]
            new_img = cv2.resize(new_img, (w, h))
        
        base_gray = self.preprocess_for_diff(base_img)
        new_gray = self.preprocess_for_diff(new_img)
        
        base_blur = cv2.GaussianBlur(base_gray, (5, 5), 0)
        new_blur = cv2.GaussianBlur(new_gray, (5, 5), 0)
        
        diff = cv2.absdiff(new_blur, base_blur)
        
        _, binary = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)
        
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        scratches = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area >= min_area:
                x, y, w, h = cv2.boundingRect(cnt)
                scratches.append({
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'area': int(area),
                    'contour': cnt
                })
        
        scratches.sort(key=lambda s: s['area'], reverse=True)
        
        return scratches, diff, binary
    
    def mark_scratches(self, image, scratches, max_marks=20):
        result = image.copy()
        
        color_new = (0, 165, 255)
        color_text = (0, 0, 0)
        
        for i, s in enumerate(scratches[:max_marks]):
            x, y, w, h = s['x'], s['y'], s['width'], s['height']
            
            cv2.rectangle(result, (x-2, y-2), (x+w+2, y+h+2), color_new, 2)
            
            label = f"#{i+1}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            
            cv2.rectangle(result, (x, y-th-4), (x+tw+4, y), color_new, -1)
            cv2.putText(result, label, (x+2, y-2),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_text, 1, cv2.LINE_AA)
        
        return result
    
    def create_comparison_view(self, base_img, new_img, marked_img, scratches):
        h, w = base_img.shape[:2]
        
        base_rgb = cv2.cvtColor(base_img, cv2.COLOR_BGR2RGB)
        new_rgb = cv2.cvtColor(new_img, cv2.COLOR_BGR2RGB)
        marked_rgb = cv2.cvtColor(marked_img, cv2.COLOR_BGR2RGB)
        
        cv2.putText(base_rgb, "历史照片", (10, 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
        
        cv2.putText(new_rgb, "当前照片", (10, 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
        
        cv2.putText(marked_rgb, f"检测结果 - 发现 {len(scratches)} 处异常", (10, 25),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2, cv2.LINE_AA)
        
        top = np.hstack([base_rgb, new_rgb])
        combined = np.vstack([top, np.hstack([marked_rgb, marked_rgb])])
        
        return combined
    
    def compare(self, base_image_path, new_image_path, output_path=None):
        results = {
            'success': False,
            'error': None,
            'base_image': None,
            'new_image': None,
            'aligned_image': None,
            'marked_image': None,
            'scratches': [],
            'num_matches': 0,
            'match_quality': ''
        }
        
        base_img, err = self.load_image(base_image_path)
        if err:
            results['error'] = f"历史照片: {err}"
            return results
        
        new_img, err = self.load_image(new_image_path)
        if err:
            results['error'] = f"当前照片: {err}"
            return results
        
        results['base_image'] = base_img
        results['new_image'] = new_img
        
        kp1, desc1, err = self.extract_features(base_img)
        if err:
            results['error'] = f"历史照片特征提取: {err}"
            return results
        
        kp2, desc2, err = self.extract_features(new_img)
        if err:
            results['error'] = f"当前照片特征提取: {err}"
            return results
        
        matches, err = self.match_features(desc1, desc2)
        if err:
            results['error'] = f"特征匹配: {err}"
            return results
        
        results['num_matches'] = len(matches)
        
        aligned, warn = self.align_images(base_img, new_img, kp1, kp2, matches)
        if aligned is None:
            aligned = base_img
            results['match_quality'] = '无法对齐，使用原图对比'
        elif warn:
            results['match_quality'] = warn
        else:
            results['match_quality'] = f"匹配成功 ({len(matches)} 个特征点)"
        
        results['aligned_image'] = aligned
        
        scratches, diff, binary = self.detect_scratches(aligned, new_img)
        results['scratches'] = scratches
        
        marked = self.mark_scratches(new_img.copy(), scratches)
        results['marked_image'] = marked
        
        if output_path:
            try:
                cv2.imwrite(output_path, marked)
                results['output_path'] = output_path
            except Exception as e:
                results['error'] = f"保存结果失败: {str(e)}"
        
        results['success'] = True
        return results
    
    def save_marked_image(self, image, output_path):
        try:
            cv2.imwrite(output_path, image)
            return True, None
        except Exception as e:
            return False, f"保存失败: {str(e)}"


def get_latest_after_photo(db, sword_id, current_record_id=None):
    records = db.get_maintenance_records(sword_id)
    
    for record in records:
        if current_record_id and record['id'] == current_record_id:
            continue
        
        if record.get('after_photo_path') and os.path.exists(record['after_photo_path']):
            return record['after_photo_path'], record['maintenance_date']
    
    return None, None
