import numpy as np
from typing import Tuple, List, Optional
from scipy.spatial.distance import cdist
from scipy.interpolate import interp1d


class DTWComparator:
    def __init__(
        self,
        use_dynamic_band: bool = True,
        sakoe_chiba_ratio: float = 0.5,
        min_band_width: int = 15,
        max_band_width: int = 100,
        use_time_normalization: bool = True,
        target_frames: int = 30
    ):
        self.use_dynamic_band = use_dynamic_band
        self.sakoe_chiba_ratio = sakoe_chiba_ratio
        self.min_band_width = min_band_width
        self.max_band_width = max_band_width
        self.use_time_normalization = use_time_normalization
        self.target_frames = target_frames

    def compute_dynamic_band(self, n_frames: int, m_frames: int) -> int:
        max_len = max(n_frames, m_frames)
        min_len = min(n_frames, m_frames)

        if self.use_dynamic_band:
            length_diff = abs(n_frames - m_frames)
            dynamic_band = int(max_len * self.sakoe_chiba_ratio)
            dynamic_band = max(dynamic_band, length_diff + 5)
            dynamic_band = max(dynamic_band, self.min_band_width)
            dynamic_band = min(dynamic_band, self.max_band_width)
        else:
            dynamic_band = self.min_band_width

        return dynamic_band

    def interpolate_sequence(self, sequence: np.ndarray, target_len: int) -> np.ndarray:
        if len(sequence) == target_len:
            return sequence

        original_len = len(sequence)
        feature_dim = sequence.shape[1]

        original_indices = np.linspace(0, 1, original_len)
        target_indices = np.linspace(0, 1, target_len)

        interpolated = np.zeros((target_len, feature_dim))

        for dim in range(feature_dim):
            f = interp1d(original_indices, sequence[:, dim], kind='cubic', fill_value='extrapolate')
            interpolated[:, dim] = f(target_indices)

        return interpolated

    def normalize_time(
        self,
        template: np.ndarray,
        input_data: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        len_template = len(template)
        len_input = len(input_data)

        if self.use_time_normalization:
            target_len = self.target_frames
            template_norm = self.interpolate_sequence(template, target_len)
            input_norm = self.interpolate_sequence(input_data, target_len)
            time_stretch_factor = len_input / len_template
            return template_norm, input_norm, time_stretch_factor
        else:
            return template, input_data, len_input / len_template

    def compute_distance_matrix(self, template: np.ndarray, input_data: np.ndarray) -> np.ndarray:
        return cdist(template, input_data, metric='euclidean')

    def compute_dtw_matrix(
        self,
        distance_matrix: np.ndarray,
        band_width: int
    ) -> np.ndarray:
        n, m = distance_matrix.shape
        dtw_matrix = np.full((n + 1, m + 1), np.inf)
        dtw_matrix[0, 0] = 0

        for i in range(1, n + 1):
            j_start = max(1, i - band_width)
            j_end = min(m + 1, i + band_width + 1)

            for j in range(j_start, j_end):
                cost = distance_matrix[i - 1, j - 1]

                diag = dtw_matrix[i - 1, j - 1]
                up = dtw_matrix[i - 1, j]
                left = dtw_matrix[i, j - 1]

                min_prev = min(diag, up, left)

                if min_prev == diag:
                    step_penalty = 1.0
                elif min_prev == up or min_prev == left:
                    step_penalty = 1.2
                else:
                    step_penalty = 1.0

                dtw_matrix[i, j] = cost + step_penalty * min_prev

        return dtw_matrix

    def find_warping_path(
        self,
        dtw_matrix: np.ndarray,
        distance_matrix: np.ndarray
    ) -> Tuple[List[Tuple[int, int]], List[float], float]:
        n, m = distance_matrix.shape
        path = []
        i, j = n, m

        while i > 0 and j > 0:
            path.append((i - 1, j - 1))

            diag = dtw_matrix[i - 1, j - 1]
            up = dtw_matrix[i - 1, j]
            left = dtw_matrix[i, j - 1]

            candidates = [
                (diag, i - 1, j - 1),
                (up, i - 1, j),
                (left, i, j - 1)
            ]

            _, i, j = min(candidates, key=lambda x: x[0])

        path.reverse()

        similarity_per_frame = []
        total_distance = 0
        count = 0

        for template_idx, input_idx in path:
            distance = distance_matrix[template_idx, input_idx]
            similarity_per_frame.append(float(distance))
            total_distance += distance
            count += 1

        avg_distance = total_distance / count if count > 0 else float('inf')

        return path, similarity_per_frame, avg_distance

    def compute_warping_path_metrics(
        self,
        path: List[Tuple[int, int]],
        n: int,
        m: int
    ) -> dict:
        if not path:
            return {"continuity": 0.0, "time_stretch_ratio": 1.0, "path_efficiency": 0.0}

        template_indices = [p[0] for p in path]
        input_indices = [p[1] for p in path]

        template_changes = np.sum(np.diff(template_indices) > 0)
        input_changes = np.sum(np.diff(input_indices) > 0)
        total_steps = len(path) - 1

        continuity = (template_changes + input_changes) / (2 * total_steps) if total_steps > 0 else 1.0

        time_stretch_ratio = m / n if n > 0 else 1.0

        optimal_path_length = max(n, m)
        path_efficiency = optimal_path_length / len(path) if len(path) > 0 else 0.0

        return {
            "continuity": continuity,
            "time_stretch_ratio": time_stretch_ratio,
            "path_efficiency": path_efficiency
        }

    def compute_adaptive_score(
        self,
        avg_distance: float,
        path_metrics: dict,
        n_frames_template: int,
        n_frames_input: int
    ) -> float:
        feature_dim = 63
        max_expected_distance = np.sqrt(feature_dim) * 0.5

        normalized_distance = avg_distance / max_expected_distance
        normalized_distance = min(normalized_distance, 1.0)

        base_score = (1.0 - normalized_distance) * 100

        continuity = path_metrics.get("continuity", 1.0)
        path_efficiency = path_metrics.get("path_efficiency", 1.0)
        time_stretch_ratio = path_metrics.get("time_stretch_ratio", 1.0)

        length_ratio = min(n_frames_input, n_frames_template) / max(n_frames_input, n_frames_template)
        length_bonus = length_ratio * 0.15

        time_stretch_penalty = 0.0
        if time_stretch_ratio > 2.0 or time_stretch_ratio < 0.5:
            time_stretch_penalty = (1.0 - min(time_stretch_ratio, 1 / time_stretch_ratio) * 2) * 0.1

        quality_factor = (continuity * 0.4 + path_efficiency * 0.4 + 0.2)
        quality_factor = max(0.85, min(quality_factor, 1.0))

        final_score = base_score * quality_factor
        final_score = final_score * (1.0 + length_bonus - time_stretch_penalty)
        final_score = max(0.0, min(100.0, final_score))

        if length_ratio >= 0.6 and base_score >= 70:
            final_score = min(final_score + 5, 100)

        return final_score

    def compare_sequences(
        self,
        template_landmarks: np.ndarray,
        input_landmarks: np.ndarray
    ) -> Tuple[float, float, List[float], List[Tuple[int, int]], dict]:
        if len(template_landmarks) == 0 or len(input_landmarks) == 0:
            return 0.0, 0.0, [], [], {}

        min_frames = min(len(template_landmarks), len(input_landmarks))
        if min_frames < 2:
            return 0.0, 0.0, [], [], {}

        n_frames_template = len(template_landmarks)
        n_frames_input = len(input_landmarks)

        template_processed, input_processed, time_stretch_factor = self.normalize_time(
            template_landmarks,
            input_landmarks
        )

        distance_matrix = self.compute_distance_matrix(template_processed, input_processed)

        band_width = self.compute_dynamic_band(
            len(template_processed),
            len(input_processed)
        )

        dtw_matrix = self.compute_dtw_matrix(distance_matrix, band_width)

        path, similarity_per_frame, avg_distance = self.find_warping_path(
            dtw_matrix,
            distance_matrix
        )

        path_metrics = self.compute_warping_path_metrics(
            path,
            len(template_processed),
            len(input_processed)
        )
        path_metrics["time_stretch_factor"] = time_stretch_factor
        path_metrics["band_width_used"] = band_width
        path_metrics["original_template_frames"] = n_frames_template
        path_metrics["original_input_frames"] = n_frames_input
        path_metrics["normalized_frames"] = len(template_processed)

        score = self.compute_adaptive_score(
            avg_distance,
            path_metrics,
            n_frames_template,
            n_frames_input
        )

        return score, avg_distance, similarity_per_frame, path, path_metrics

    def compute_landmark_deviations(
        self,
        template_landmarks: np.ndarray,
        input_landmarks: np.ndarray,
        warping_path: List[Tuple[int, int]] = None
    ) -> List[dict]:
        deviations = []

        if warping_path is None or len(warping_path) == 0:
            min_frames = min(len(template_landmarks), len(input_landmarks))
            for landmark_idx in range(21):
                template_point = template_landmarks[:min_frames, landmark_idx * 3:landmark_idx * 3 + 3]
                input_point = input_landmarks[:min_frames, landmark_idx * 3:landmark_idx * 3 + 3]

                distances = np.sqrt(np.sum((template_point - input_point) ** 2, axis=1))
                avg_deviation = float(np.mean(distances))
                max_deviation = float(np.max(distances))

                deviations.append({
                    "landmark_index": landmark_idx,
                    "average_deviation": avg_deviation,
                    "max_deviation": max_deviation,
                    "deviation_per_frame": [float(d) for d in distances]
                })
        else:
            for landmark_idx in range(21):
                aligned_distances = []

                for template_idx, input_idx in warping_path:
                    template_point = template_landmarks[template_idx, landmark_idx * 3:landmark_idx * 3 + 3]
                    input_point = input_landmarks[input_idx, landmark_idx * 3:landmark_idx * 3 + 3]

                    distance = np.sqrt(np.sum((template_point - input_point) ** 2))
                    aligned_distances.append(distance)

                distances = np.array(aligned_distances)
                avg_deviation = float(np.mean(distances))
                max_deviation = float(np.max(distances))

                deviations.append({
                    "landmark_index": landmark_idx,
                    "average_deviation": avg_deviation,
                    "max_deviation": max_deviation,
                    "deviation_per_frame": [float(d) for d in distances]
                })

        return deviations

    def compare_with_heatmap(
        self,
        template_landmarks: np.ndarray,
        input_landmarks: np.ndarray
    ) -> dict:
        score, avg_distance, similarity_per_frame, path, path_metrics = self.compare_sequences(
            template_landmarks,
            input_landmarks
        )

        template_processed, input_processed, _ = self.normalize_time(
            template_landmarks,
            input_landmarks
        )

        landmark_deviations = self.compute_landmark_deviations(
            template_processed,
            input_processed,
            path
        )

        return {
            "score": round(score, 2),
            "average_distance": round(avg_distance, 4),
            "similarity_per_frame": [round(s, 4) for s in similarity_per_frame],
            "landmark_deviations": landmark_deviations,
            "frame_count_template": len(template_landmarks),
            "frame_count_input": len(input_landmarks),
            "path_metrics": {k: round(v, 4) if isinstance(v, float) else v for k, v in path_metrics.items()},
            "warping_path": path
        }
