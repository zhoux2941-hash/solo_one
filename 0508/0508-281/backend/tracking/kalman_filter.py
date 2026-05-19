import numpy as np
from filterpy.kalman import KalmanFilter


class KalmanBoxTracker:
    count = 0
    
    def __init__(self, bbox):
        self.kf = KalmanFilter(dim_x=7, dim_z=4)
        self.kf.F = np.array([
            [1, 0, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 1]
        ])
        self.kf.H = np.array([
            [1, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0]
        ])
        
        self.kf.P[4:, 4:] *= 100.0
        self.kf.P *= 10.0
        self.kf.Q[-1, -1] *= 0.01
        self.kf.Q[4:, 4:] *= 0.01
        self.kf.Q[2:, 2:] *= 0.1
        
        self.R_std = 1.0
        self.kf.R *= self.R_std
        
        self.kf.x[:4] = self._convert_bbox_to_z(bbox)
        self.time_since_update = 0
        self.id = KalmanBoxTracker.count
        KalmanBoxTracker.count += 1
        self.history = []
        self.hits = 0
        self.hit_streak = 0
        self.age = 0
        self.confidence = bbox.get('confidence', 1.0)
        self.class_id = bbox.get('class_id', 0)
        self.class_name = bbox.get('class_name', 'unknown')
        
        self.bbox_history = []
        self.smooth_window = 5
        self.last_bbox = self._convert_bbox_to_z(bbox)
    
    def update(self, bbox):
        self.time_since_update = 0
        self.history = []
        self.hits += 1
        self.hit_streak += 1
        self.confidence = bbox.get('confidence', 1.0)
        self.class_id = bbox.get('class_id', 0)
        self.class_name = bbox.get('class_name', 'unknown')
        
        z = self._convert_bbox_to_z(bbox)
        self.bbox_history.append(z)
        if len(self.bbox_history) > self.smooth_window:
            self.bbox_history.pop(0)
        
        if len(self.bbox_history) > 1:
            smoothed_z = np.mean(self.bbox_history, axis=0)
            self.kf.update(smoothed_z)
        else:
            self.kf.update(z)
        
        self.last_bbox = z
    
    def predict(self):
        if (self.kf.x[6] + self.kf.x[2]) <= 0:
            self.kf.x[6] *= 0.0
        
        if self.time_since_update > 10:
            self.kf.Q[4:, 4:] *= 1.1
        elif self.time_since_update < 3:
            self.kf.Q[4:, 4:] *= 0.9
        
        self.kf.predict()
        self.age += 1
        if self.time_since_update > 0:
            self.hit_streak = 0
        self.time_since_update += 1
        self.history.append(self._convert_x_to_bbox(self.kf.x))
        return self.history[-1]
    
    def get_state(self):
        pred_bbox = self._convert_x_to_bbox(self.kf.x)
        
        if self.time_since_update > 0 and len(self.bbox_history) > 0:
            alpha = min(0.8, self.time_since_update * 0.1)
            last_bbox = self._convert_z_to_bbox(self.last_bbox)
            smooth_bbox = (1 - alpha) * pred_bbox + alpha * last_bbox
            return smooth_bbox
        
        return pred_bbox
    
    def _convert_bbox_to_z(self, bbox):
        w = bbox['bbox'][2] - bbox['bbox'][0]
        h = bbox['bbox'][3] - bbox['bbox'][1]
        x = bbox['bbox'][0] + w / 2.0
        y = bbox['bbox'][1] + h / 2.0
        s = w * h
        r = w / float(h)
        return np.array([x, y, s, r]).reshape((4, 1))
    
    def _convert_z_to_bbox(self, z):
        x, y, s, r = z.flatten()
        w = np.sqrt(s * r)
        h = s / w
        return np.array([
            x - w / 2.0, y - h / 2.0,
            x + w / 2.0, y + h / 2.0
        ]).reshape((1, 4))
    
    def _convert_x_to_bbox(self, x, score=None):
        w = np.sqrt(x[2] * x[3])
        h = x[2] / w
        if score is None:
            return np.array([
                x[0] - w / 2.0, x[1] - h / 2.0,
                x[0] + w / 2.0, x[1] + h / 2.0
            ]).reshape((1, 4))
        else:
            return np.array([
                x[0] - w / 2.0, x[1] - h / 2.0,
                x[0] + w / 2.0, x[1] + h / 2.0,
                score
            ]).reshape((1, 5))
