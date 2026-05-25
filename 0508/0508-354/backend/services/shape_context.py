import numpy as np
import cv2
from scipy.spatial.distance import cdist


class ShapeContextMatcher:
    def __init__(self, n_bins_r=5, n_bins_theta=12, r_inner=0.1250, r_outer=2.0):
        self.n_bins_r = n_bins_r
        self.n_bins_theta = n_bins_theta
        self.r_inner = r_inner
        self.r_outer = r_outer
        self.r_array = np.logspace(np.log10(r_inner), np.log10(r_outer), n_bins_r + 1)

    def get_skeleton_points(self, skeleton):
        points = []
        rows, cols = skeleton.shape
        for i in range(rows):
            for j in range(cols):
                if skeleton[i, j] > 0:
                    points.append([j, i])
        return np.array(points, dtype=np.float64)

    def sample_points(self, points, n_samples=100):
        if len(points) == 0:
            return np.random.rand(n_samples, 2) * 100
        if len(points) <= n_samples:
            indices = np.random.choice(len(points), n_samples, replace=True)
        else:
            indices = np.random.choice(len(points), n_samples, replace=False)
        return points[indices]

    def compute_shape_context(self, points):
        n_points = len(points)
        histograms = np.zeros((n_points, self.n_bins_r * self.n_bins_theta))

        for i in range(n_points):
            diff = points - points[i]
            r = np.sqrt(diff[:, 0] ** 2 + diff[:, 1] ** 2)
            theta = np.arctan2(diff[:, 1], diff[:, 0])

            r[r == 0] = 1e-10

            mean_dist = np.mean(r)
            if mean_dist > 0:
                r_normalized = r / mean_dist
            else:
                r_normalized = r

            r_bin = np.digitize(r_normalized, self.r_array) - 1
            r_bin = np.clip(r_bin, 0, self.n_bins_r - 1)

            theta_bin = np.floor((theta + np.pi) / (2 * np.pi) * self.n_bins_theta).astype(int)
            theta_bin = np.clip(theta_bin, 0, self.n_bins_theta - 1)

            hist = np.zeros((self.n_bins_r, self.n_bins_theta))
            for j in range(n_points):
                if j != i:
                    hist[r_bin[j], theta_bin[j]] += 1

            histograms[i] = hist.flatten()

        return histograms

    def compute_cost_matrix(self, sc1, sc2):
        epsilon = 1e-10
        sc1_normalized = sc1 / (sc1.sum(axis=1, keepdims=True) + epsilon)
        sc2_normalized = sc2 / (sc2.sum(axis=1, keepdims=True) + epsilon)

        cost = np.zeros((len(sc1), len(sc2)))
        for i in range(len(sc1)):
            for j in range(len(sc2)):
                diff = sc1_normalized[i] - sc2_normalized[j]
                cost[i, j] = 0.5 * np.sum(diff ** 2 / (sc1_normalized[i] + sc2_normalized[j] + epsilon))

        return cost

    def hungarian_matching(self, cost_matrix):
        try:
            from scipy.optimize import linear_sum_assignment
            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            return row_ind, col_ind
        except ImportError:
            return self._greedy_matching(cost_matrix)

    def _greedy_matching(self, cost_matrix):
        n, m = cost_matrix.shape
        row_ind = []
        col_ind = []
        used_cols = set()

        for i in range(n):
            min_cost = float('inf')
            min_col = -1
            for j in range(m):
                if j not in used_cols and cost_matrix[i, j] < min_cost:
                    min_cost = cost_matrix[i, j]
                    min_col = j
            if min_col >= 0:
                row_ind.append(i)
                col_ind.append(min_col)
                used_cols.add(min_col)

        return np.array(row_ind), np.array(col_ind)

    def compute_similarity(self, img1, img2, n_samples=100):
        points1 = self.get_skeleton_points(img1)
        points2 = self.get_skeleton_points(img2)

        if len(points1) < 10 or len(points2) < 10:
            return 0.0, [], []

        points1 = self.sample_points(points1, n_samples)
        points2 = self.sample_points(points2, n_samples)

        points1 = self._normalize_points(points1)
        points2 = self._normalize_points(points2)

        sc1 = self.compute_shape_context(points1)
        sc2 = self.compute_shape_context(points2)

        cost = self.compute_cost_matrix(sc1, sc2)
        row_ind, col_ind = self.hungarian_matching(cost)

        total_cost = cost[row_ind, col_ind].sum()
        avg_cost = total_cost / len(row_ind)

        similarity = max(0, 100 * (1 - avg_cost / 5.0))

        matched_pairs = [(points1[i], points2[j]) for i, j in zip(row_ind, col_ind)]

        return similarity, matched_pairs, (points1, points2, row_ind, col_ind)

    def _normalize_points(self, points):
        if len(points) == 0:
            return points
        centroid = np.mean(points, axis=0)
        points = points - centroid
        scale = np.max(np.sqrt(points[:, 0] ** 2 + points[:, 1] ** 2))
        if scale > 0:
            points = points / scale
        return points

    def compute_difference_mask(self, skeleton1, skeleton2, kernel_size=5):
        if skeleton1.shape != skeleton2.shape:
            skeleton2 = cv2.resize(skeleton2, (skeleton1.shape[1], skeleton1.shape[0]))

        s1 = skeleton1.astype(np.float32) / 255.0
        s2 = skeleton2.astype(np.float32) / 255.0

        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        s1_dilated = cv2.dilate(s1, kernel, iterations=2)
        s2_dilated = cv2.dilate(s2, kernel, iterations=2)

        diff1 = s1 * (1 - s2_dilated)
        diff2 = s2 * (1 - s1_dilated)

        diff_mask = (diff1 + diff2) > 0.3

        return diff_mask.astype(np.uint8) * 255

    def find_difference_regions(self, skeleton1, skeleton2):
        diff_mask = self.compute_difference_mask(skeleton1, skeleton2)

        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(diff_mask)

        regions = []
        for i in range(1, num_labels):
            x, y, w, h, area = stats[i]
            if area > 20:
                regions.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h),
                    'area': int(area),
                    'centroid': (int(centroids[i][0]), int(centroids[i][1]))
                })

        regions.sort(key=lambda r: r['area'], reverse=True)
        return regions

    def compute_structure_similarity(self, skeleton1, skeleton2):
        if skeleton1.shape != skeleton2.shape:
            skeleton2 = cv2.resize(skeleton2, (skeleton1.shape[1], skeleton1.shape[0]))

        s1 = skeleton1.astype(np.float32) / 255.0
        s2 = skeleton2.astype(np.float32) / 255.0

        intersection = np.sum(s1 * s2)
        union = np.sum(s1) + np.sum(s2) - intersection

        if union > 0:
            iou = intersection / union
        else:
            iou = 0

        return iou * 100

    def compute_combined_similarity(self, skeleton1, skeleton2):
        structure_score = self.compute_structure_similarity(skeleton1, skeleton2)

        shape_score, _, _ = self.compute_similarity(skeleton1, skeleton2, n_samples=80)

        if skeleton1.shape != skeleton2.shape:
            skeleton2 = cv2.resize(skeleton2, (skeleton1.shape[1], skeleton1.shape[0]))

        s1 = skeleton1.astype(np.float32) / 255.0
        s2 = skeleton2.astype(np.float32) / 255.0

        kernel = np.ones((3, 3), np.uint8)
        s1_smooth = cv2.GaussianBlur(s1, (5, 5), 0)
        s2_smooth = cv2.GaussianBlur(s2, (5, 5), 0)

        corr = np.corrcoef(s1_smooth.flatten(), s2_smooth.flatten())[0, 1]
        correlation_score = max(0, corr) * 100

        combined_score = 0.4 * structure_score + 0.35 * shape_score + 0.25 * correlation_score

        return min(100, max(0, combined_score))
