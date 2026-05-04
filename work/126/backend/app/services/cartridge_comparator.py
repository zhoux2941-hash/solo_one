import numpy as np
import cv2
from pathlib import Path
from typing import Tuple, Optional, Dict, List, Any
import time

class CartridgeComparator:
    def __init__(self, feature_type: str = "sift"):
        self.feature_type = feature_type.lower()
        
        if self.feature_type == "sift":
            self.detector = cv2.SIFT_create(nfeatures=2000)
            self.flann_index_kdtree = 1
            self.flann_params = dict(algorithm=self.flann_index_kdtree, trees=5)
        elif self.feature_type == "orb":
            self.detector = cv2.ORB_create(nfeatures=2000)
            self.flann_index_lsh = 6
            self.flann_params = dict(
                algorithm=self.flann_index_lsh,
                table_number=6,
                key_size=12,
                multi_probe_level=1
            )
        else:
            self.detector = cv2.SIFT_create(nfeatures=2000)
            self.flann_index_kdtree = 1
            self.flann_params = dict(algorithm=self.flann_index_kdtree, trees=5)
        
        self.search_params = dict(checks=50)
    
    def match_features(
        self,
        desc1: np.ndarray,
        desc2: np.ndarray,
        ratio_threshold: float = 0.75
    ) -> Tuple[List[cv2.DMatch], List[cv2.DMatch]]:
        if desc1 is None or desc2 is None:
            return [], []
        
        if len(desc1) < 2 or len(desc2) < 2:
            return [], []
        
        try:
            if self.feature_type in ["sift", "akaze"]:
                flann = cv2.FlannBasedMatcher(self.flann_params, self.search_params)
                matches = flann.knnMatch(desc1, desc2, k=2)
            else:
                bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
                matches = bf.knnMatch(desc1, desc2, k=2)
            
            good_matches = []
            all_matches = []
            
            for match_pair in matches:
                if len(match_pair) == 2:
                    m, n = match_pair
                    all_matches.append(m)
                    if m.distance < ratio_threshold * n.distance:
                        good_matches.append(m)
            
            return good_matches, all_matches
            
        except Exception as e:
            print(f"Feature matching error: {e}")
            return [], []
    
    def find_homography(
        self,
        kp1: List[cv2.KeyPoint],
        kp2: List[cv2.KeyPoint],
        good_matches: List[cv2.DMatch],
        ransac_threshold: float = 5.0
    ) -> Tuple[Optional[np.ndarray], np.ndarray, List]:
        if len(good_matches) < 4:
            return None, np.array([]), []
        
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        
        try:
            H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, ransac_threshold)
            
            if mask is not None:
                mask = mask.ravel()
                inliers = [good_matches[i] for i in range(len(good_matches)) if mask[i] == 1]
                outliers = [good_matches[i] for i in range(len(good_matches)) if mask[i] == 0]
            else:
                inliers = good_matches
                outliers = []
                mask = np.ones(len(good_matches))
            
            return H, mask, inliers
            
        except Exception as e:
            print(f"Homography error: {e}")
            return None, np.array([]), []
    
    def calculate_similarity_score(
        self,
        good_matches: List,
        inliers: List,
        total_features1: int,
        total_features2: int,
        region_name: str = ""
    ) -> float:
        if total_features1 == 0 or total_features2 == 0:
            return 0.0
        
        match_ratio = len(good_matches) / min(total_features1, total_features2)
        
        if len(good_matches) > 0:
            inlier_ratio = len(inliers) / len(good_matches)
        else:
            inlier_ratio = 0.0
        
        similarity = (match_ratio * 0.4) + (inlier_ratio * 0.6)
        
        similarity = min(1.0, similarity * 2.5)
        
        return similarity
    
    def compare_regions(
        self,
        features1: Dict[str, Any],
        features2: Dict[str, Any],
        region_name: str
    ) -> Dict[str, Any]:
        region_key = region_name.lower()
        
        desc1 = features1.get(region_key, {}).get("descriptors", None)
        desc2 = features2.get(region_key, {}).get("descriptors", None)
        
        kp1 = features1.get(region_key, {}).get("keypoints", [])
        kp2 = features2.get(region_key, {}).get("keypoints", [])
        
        count1 = features1.get(region_key, {}).get("keypoints_count", 0)
        count2 = features2.get(region_key, {}).get("keypoints_count", 0)
        
        if desc1 is None or desc2 is None or len(desc1) < 2 or len(desc2) < 2:
            return {
                "similarity": 0.0,
                "good_matches_count": 0,
                "inlier_count": 0,
                "outlier_count": 0,
                "matched_points": [],
                "homography": None
            }
        
        good_matches, all_matches = self.match_features(desc1, desc2)
        
        if len(good_matches) < 4:
            return {
                "similarity": 0.0,
                "good_matches_count": len(good_matches),
                "inlier_count": 0,
                "outlier_count": len(good_matches),
                "matched_points": [],
                "homography": None
            }
        
        H, mask, inliers = self.find_homography(kp1, kp2, good_matches)
        
        similarity = self.calculate_similarity_score(
            good_matches, inliers, count1, count2, region_name
        )
        
        matched_points = []
        for m in inliers:
            if m.queryIdx < len(kp1) and m.trainIdx < len(kp2):
                matched_points.append({
                    "query_point": {"x": float(kp1[m.queryIdx].pt[0]), "y": float(kp1[m.queryIdx].pt[1])},
                    "sample_point": {"x": float(kp2[m.trainIdx].pt[0]), "y": float(kp2[m.trainIdx].pt[1])},
                    "distance": float(m.distance),
                    "inlier": True
                })
        
        H_list = H.tolist() if H is not None else None
        
        return {
            "similarity": similarity,
            "good_matches_count": len(good_matches),
            "inlier_count": len(inliers),
            "outlier_count": len(good_matches) - len(inliers),
            "matched_points": matched_points[:100],
            "homography": H_list
        }
    
    def compare_images(
        self,
        features1: Dict[str, Any],
        features2: Dict[str, Any]
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        primer_result = self.compare_regions(features1, features2, "primer")
        firing_pin_result = self.compare_regions(features1, features2, "firing_pin")
        ejector_result = self.compare_regions(features1, features2, "ejector")
        extractor_result = self.compare_regions(features1, features2, "extractor")
        
        weights = {
            "primer": 0.35,
            "firing_pin": 0.30,
            "ejector": 0.20,
            "extractor": 0.15
        }
        
        overall_similarity = (
            primer_result["similarity"] * weights["primer"] +
            firing_pin_result["similarity"] * weights["firing_pin"] +
            ejector_result["similarity"] * weights["ejector"] +
            extractor_result["similarity"] * weights["extractor"]
        )
        
        total_inliers = (
            primer_result["inlier_count"] +
            firing_pin_result["inlier_count"] +
            ejector_result["inlier_count"] +
            extractor_result["inlier_count"]
        )
        
        all_matched_points = (
            primer_result["matched_points"] +
            firing_pin_result["matched_points"] +
            ejector_result["matched_points"] +
            extractor_result["matched_points"]
        )
        
        all_matched_points.sort(key=lambda x: x["distance"])
        
        comparison_time = time.time() - start_time
        
        if overall_similarity > 0.7:
            confidence = "high"
        elif overall_similarity > 0.4:
            confidence = "medium"
        else:
            confidence = "low"
        
        return {
            "overall_similarity": float(overall_similarity),
            "primer_similarity": float(primer_result["similarity"]),
            "firing_pin_similarity": float(firing_pin_result["similarity"]),
            "ejector_similarity": float(ejector_result["similarity"]),
            "extractor_similarity": float(extractor_result["similarity"]),
            "total_inlier_count": total_inliers,
            "primer_inliers": primer_result["inlier_count"],
            "firing_pin_inliers": firing_pin_result["inlier_count"],
            "ejector_inliers": ejector_result["inlier_count"],
            "extractor_inliers": extractor_result["inlier_count"],
            "matched_points": all_matched_points[:200],
            "comparison_time": comparison_time,
            "confidence": confidence,
            "primer_homography": primer_result.get("homography"),
            "firing_pin_homography": firing_pin_result.get("homography")
        }
    
    def compare_with_database(
        self,
        query_features: Dict[str, Any],
        database_samples: List[Dict[str, Any]],
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        results = []
        
        for sample in database_samples:
            sample_features = sample.get("features", {})
            comparison = self.compare_images(query_features, sample_features)
            
            results.append({
                "sample_id": sample.get("sample_id"),
                "sample_name": sample.get("sample_name", ""),
                "image_id": sample.get("image_id"),
                "overall_similarity": comparison["overall_similarity"],
                "primer_similarity": comparison["primer_similarity"],
                "firing_pin_similarity": comparison["firing_pin_similarity"],
                "ejector_similarity": comparison["ejector_similarity"],
                "extractor_similarity": comparison["extractor_similarity"],
                "inlier_count": comparison["total_inlier_count"],
                "matched_points": comparison["matched_points"],
                "confidence": comparison["confidence"],
                "comparison": comparison
            })
        
        results.sort(key=lambda x: x["overall_similarity"], reverse=True)
        
        for i, result in enumerate(results[:top_n]):
            result["rank"] = i + 1
        
        return results[:top_n]
