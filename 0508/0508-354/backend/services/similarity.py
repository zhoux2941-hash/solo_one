import numpy as np
import cv2
from PIL import Image
from .skeleton_extractor import SkeletonExtractor
from .shape_context import ShapeContextMatcher


class SimilarityCalculator:
    def __init__(self):
        self.skeleton_extractor = SkeletonExtractor()
        self.shape_matcher = ShapeContextMatcher()

    def calculate_similarity(self, reference_image, user_image):
        ref_skeleton = self._extract_skeleton(reference_image)
        user_skeleton = self._extract_skeleton(user_image)

        if ref_skeleton is None or user_skeleton is None:
            return {
                'score': 0,
                'structure_score': 0,
                'shape_score': 0,
                'correlation_score': 0,
                'thickness_score': 0,
                'difference_regions': [],
                'overlay_image': None
            }

        structure_score = self.shape_matcher.compute_structure_similarity(ref_skeleton, user_skeleton)
        shape_score, matched_pairs, match_data = self.shape_matcher.compute_similarity(
            ref_skeleton, user_skeleton, n_samples=80
        )
        correlation_score = self._compute_correlation_score(ref_skeleton, user_skeleton)

        thickness_score = self._compute_thickness_similarity(reference_image, user_image)

        combined_score = (0.25 * structure_score + 
                         0.25 * shape_score + 
                         0.15 * correlation_score +
                         0.35 * thickness_score)
        combined_score = min(100, max(0, combined_score))

        difference_regions = self.shape_matcher.find_difference_regions(ref_skeleton, user_skeleton)

        thickness_diff_regions = self._find_thickness_differences(reference_image, user_image)
        difference_regions.extend(thickness_diff_regions)

        overlay_image = self._create_overlay(reference_image, user_image, ref_skeleton, user_skeleton,
                                             difference_regions)

        return {
            'score': round(combined_score, 1),
            'structure_score': round(structure_score, 1),
            'shape_score': round(shape_score, 1),
            'correlation_score': round(correlation_score, 1),
            'thickness_score': round(thickness_score, 1),
            'difference_regions': difference_regions[:10],
            'overlay_image': overlay_image
        }

    def _extract_skeleton(self, image):
        if image is None:
            return None

        if isinstance(image, Image.Image):
            image = np.array(image)

        if len(image.shape) == 3 and image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2GRAY)
        elif len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        processed = self.skeleton_extractor.preprocess_image(image, target_size=200)

        skeleton = self.skeleton_extractor.extract_skeleton(processed)

        return skeleton

    def _compute_correlation_score(self, skeleton1, skeleton2):
        if skeleton1.shape != skeleton2.shape:
            skeleton2 = cv2.resize(skeleton2, (skeleton1.shape[1], skeleton1.shape[0]))

        s1 = skeleton1.astype(np.float32) / 255.0
        s2 = skeleton2.astype(np.float32) / 255.0

        s1_smooth = cv2.GaussianBlur(s1, (5, 5), 0)
        s2_smooth = cv2.GaussianBlur(s2, (5, 5), 0)

        corr = np.corrcoef(s1_smooth.flatten(), s2_smooth.flatten())[0, 1]
        correlation_score = max(0, corr) * 100

        return correlation_score

    def _compute_thickness_similarity(self, ref_image, user_image):
        ref_binary = self._prepare_binary_image(ref_image)
        user_binary = self._prepare_binary_image(user_image)

        if ref_binary is None or user_binary is None:
            return 50.0

        if ref_binary.shape != user_binary.shape:
            target_size = (200, 200)
            ref_binary = cv2.resize(ref_binary, target_size)
            user_binary = cv2.resize(user_binary, target_size)

        ref_dist = cv2.distanceTransform(ref_binary, cv2.DIST_L2, 3)
        user_dist = cv2.distanceTransform(user_binary, cv2.DIST_L2, 3)

        ref_thickness_map = ref_dist * 2.0
        user_thickness_map = user_dist * 2.0

        ref_thicknesses = ref_thickness_map[ref_thickness_map > 0]
        user_thicknesses = user_thickness_map[user_thickness_map > 0]

        if len(ref_thicknesses) == 0 or len(user_thicknesses) == 0:
            return 0.0

        ref_hist, _ = np.histogram(ref_thicknesses, bins=20, range=(0, 50))
        user_hist, _ = np.histogram(user_thicknesses, bins=20, range=(0, 50))

        ref_hist = ref_hist.astype(np.float32) / (ref_hist.sum() + 1e-10)
        user_hist = user_hist.astype(np.float32) / (user_hist.sum() + 1e-10)

        intersection = np.minimum(ref_hist, user_hist).sum()

        thickness_similarity = intersection * 100

        ref_mean_thickness = np.mean(ref_thicknesses)
        user_mean_thickness = np.mean(user_thicknesses)
        
        thickness_ratio = min(ref_mean_thickness, user_mean_thickness) / max(ref_mean_thickness, user_mean_thickness)
        
        ratio_score = thickness_ratio * 100

        ref_std_thickness = np.std(ref_thicknesses)
        user_std_thickness = np.std(user_thicknesses)
        
        std_ratio = min(ref_std_thickness, user_std_thickness) / max(ref_std_thickness, user_std_thickness)
        
        std_score = std_ratio * 100

        final_thickness_score = 0.5 * thickness_similarity + 0.3 * ratio_score + 0.2 * std_score

        return min(100, max(0, final_thickness_score))

    def _prepare_binary_image(self, image):
        if image is None:
            return None

        if isinstance(image, Image.Image):
            image = np.array(image)

        if len(image.shape) == 3 and image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2GRAY)
        elif len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        binary = self.skeleton_extractor.preprocess_image(binary, target_size=200)
        
        _, binary = cv2.threshold(binary, 128, 255, cv2.THRESH_BINARY_INV)

        kernel = np.ones((3, 3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        return binary

    def _find_thickness_differences(self, ref_image, user_image):
        ref_binary = self._prepare_binary_image(ref_image)
        user_binary = self._prepare_binary_image(user_image)

        if ref_binary is None or user_binary is None:
            return []

        if ref_binary.shape != user_binary.shape:
            target_size = (200, 200)
            ref_binary = cv2.resize(ref_binary, target_size)
            user_binary = cv2.resize(user_binary, target_size)

        ref_dist = cv2.distanceTransform(ref_binary, cv2.DIST_L2, 3)
        user_dist = cv2.distanceTransform(user_binary, cv2.DIST_L2, 3)

        ref_thickness = ref_dist * 2.0
        user_thickness = user_dist * 2.0

        thickness_diff = np.abs(ref_thickness - user_thickness)
        
        _, diff_mask = cv2.threshold(thickness_diff, 5, 255, cv2.THRESH_BINARY)
        diff_mask = diff_mask.astype(np.uint8)

        ref_mask = (ref_binary > 0).astype(np.uint8) * 255
        user_mask = (user_binary > 0).astype(np.uint8) * 255
        
        common_mask = cv2.bitwise_and(ref_mask, user_mask)
        
        thickness_diff_mask = cv2.bitwise_and(diff_mask, common_mask)

        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thickness_diff_mask)

        regions = []
        for i in range(1, num_labels):
            x, y, w, h, area = stats[i]
            if area > 30:
                regions.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h),
                    'area': int(area),
                    'centroid': (int(centroids[i][0]), int(centroids[i][1])),
                    'type': 'thickness'
                })

        regions.sort(key=lambda r: r['area'], reverse=True)
        return regions[:5]

    def _create_overlay(self, ref_image, user_image, ref_skeleton, user_skeleton, difference_regions):
        if isinstance(ref_image, Image.Image):
            ref_image = np.array(ref_image)
        if isinstance(user_image, Image.Image):
            user_image = np.array(user_image)

        if len(ref_image.shape) == 2:
            ref_image = cv2.cvtColor(ref_image, cv2.COLOR_GRAY2BGR)
        elif ref_image.shape[2] == 4:
            ref_image = cv2.cvtColor(ref_image, cv2.COLOR_RGBA2BGR)

        if len(user_image.shape) == 2:
            user_image = cv2.cvtColor(user_image, cv2.COLOR_GRAY2BGR)
        elif user_image.shape[2] == 4:
            user_image = cv2.cvtColor(user_image, cv2.COLOR_RGBA2BGR)

        target_size = (400, 400)
        ref_resized = cv2.resize(ref_image, target_size)
        user_resized = cv2.resize(user_image, target_size)

        overlay = cv2.addWeighted(ref_resized, 0.4, user_resized, 0.6, 0)

        if ref_skeleton is not None:
            ref_skel_color = cv2.cvtColor(ref_skeleton, cv2.COLOR_GRAY2BGR)
            ref_skel_color[ref_skel_color[:, :, 0] > 0] = [0, 255, 0]
            ref_skel_resized = cv2.resize(ref_skel_color, target_size)
            overlay = cv2.addWeighted(overlay, 0.7, ref_skel_resized, 0.3, 0)

        for region in difference_regions:
            x, y = region['x'], region['y']
            w, h = region['width'], region['height']

            scale_x = target_size[0] / 200.0
            scale_y = target_size[1] / 200.0

            x1 = int(x * scale_x)
            y1 = int(y * scale_y)
            x2 = int((x + w) * scale_x)
            y2 = int((y + h) * scale_y)

            padding = 5
            
            if region.get('type') == 'thickness':
                cv2.rectangle(overlay,
                            (x1 - padding, y1 - padding),
                            (x2 + padding, y2 + padding),
                            (255, 165, 0), 2)
            else:
                cv2.rectangle(overlay,
                            (x1 - padding, y1 - padding),
                            (x2 + padding, y2 + padding),
                            (0, 0, 255), 2)

        return overlay

    def evaluate_stroke_order(self, ref_skeleton, user_skeleton):
        ref_points = self._extract_stroke_points(ref_skeleton)
        user_points = self._extract_stroke_points(user_skeleton)

        if len(ref_points) < 2 or len(user_points) < 2:
            return 50.0

        ref_centroid = np.mean(ref_points, axis=0)
        user_centroid = np.mean(user_points, axis=0)

        ref_angles = np.arctan2(ref_points[:, 1] - ref_centroid[1],
                                ref_points[:, 0] - ref_centroid[0])
        user_angles = np.arctan2(user_points[:, 1] - user_centroid[1],
                                  user_points[:, 0] - user_centroid[0])

        ref_order = np.argsort(ref_angles)
        user_order = np.argsort(user_angles)

        min_len = min(len(ref_order), len(user_order))
        if min_len == 0:
            return 50.0

        rank_correlation = 0
        for i in range(min_len):
            if i < len(ref_order) and i < len(user_order):
                rank_diff = abs(ref_order[i % len(ref_order)] - user_order[i % len(user_order)])
                rank_correlation += 1 - min(rank_diff / min_len, 1)

        stroke_order_score = (rank_correlation / min_len) * 100

        return stroke_order_score

    def _extract_stroke_points(self, skeleton):
        points = []
        rows, cols = skeleton.shape
        for i in range(rows):
            for j in range(cols):
                if skeleton[i, j] > 0:
                    points.append([j, i])
        return np.array(points, dtype=np.float64) if len(points) > 0 else np.array([])

    def detailed_analysis(self, reference_image, user_image):
        result = self.calculate_similarity(reference_image, user_image)

        ref_skeleton = self._extract_skeleton(reference_image)
        user_skeleton = self._extract_skeleton(user_image)

        if ref_skeleton is not None and user_skeleton is not None:
            stroke_score = self.evaluate_stroke_order(ref_skeleton, user_skeleton)
            result['stroke_order_score'] = round(stroke_score, 1)

            ref_pixels = np.sum(ref_skeleton > 0)
            user_pixels = np.sum(user_skeleton > 0)
            if user_pixels > 0:
                result['stroke_coverage'] = round(ref_pixels / max(user_pixels, 1) * 100, 1)
            else:
                result['stroke_coverage'] = 0

        return result
