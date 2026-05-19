import os
import cv2
import numpy as np
import yaml
from typing import List, Tuple, Optional

try:
    import tensorrt as trt
    import pycuda.driver as cuda
    import pycuda.autoinit
    TENSORRT_AVAILABLE = True
except ImportError:
    TENSORRT_AVAILABLE = False
    print("TensorRT not available, running in fallback mode")


class YOLOv5TRT:
    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.model_path = self.config['detector']['model_path']
        self.input_size = self.config['detector']['input_size']
        self.conf_threshold = self.config['detector']['conf_threshold']
        self.iou_threshold = self.config['detector']['iou_threshold']
        self.max_batch_size = self.config['detector']['max_batch_size']
        self.num_classes = self.config['detector']['classes']
        self.fp16 = self.config['detector']['fp16']
        
        self.engine = None
        self.context = None
        self.inputs = []
        self.outputs = []
        self.bindings = []
        self.stream = None
        
        if TENSORRT_AVAILABLE and os.path.exists(self.model_path):
            self._load_engine()
        else:
            print(f"Model file not found: {self.model_path}, using CPU fallback")
            self._init_fallback()
    
    def _load_engine(self):
        TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
        with open(self.model_path, 'rb') as f, trt.Runtime(TRT_LOGGER) as runtime:
            self.engine = runtime.deserialize_cuda_engine(f.read())
        
        self.context = self.engine.create_execution_context()
        self.stream = cuda.Stream()
        
        for binding in self.engine:
            size = trt.volume(self.engine.get_binding_shape(binding)) * self.max_batch_size
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)
            self.bindings.append(int(device_mem))
            
            if self.engine.binding_is_input(binding):
                self.inputs.append({'host': host_mem, 'device': device_mem})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem})
    
    def _init_fallback(self):
        self.fallback_mode = True
        self.colors = np.random.randint(0, 255, size=(self.num_classes, 3), dtype=np.uint8)
    
    def _preprocess(self, images: List[np.ndarray]) -> np.ndarray:
        batch_size = min(len(images), self.max_batch_size)
        processed = np.zeros((batch_size, 3, self.input_size, self.input_size), dtype=np.float32)
        
        for i in range(batch_size):
            img = images[i]
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            resized = cv2.resize(img_rgb, (self.input_size, self.input_size))
            normalized = resized.transpose(2, 0, 1) / 255.0
            processed[i] = normalized
        
        return processed
    
    def _postprocess(self, outputs: np.ndarray, original_shapes: List[Tuple[int, int]]) -> List[List[dict]]:
        batch_results = []
        
        for batch_idx, output in enumerate(outputs):
            if output is None or len(output) == 0:
                batch_results.append([])
                continue
            
            detections = []
            for det in output:
                x1, y1, x2, y2, conf, cls = det
                if conf < self.conf_threshold:
                    continue
                
                orig_h, orig_w = original_shapes[batch_idx]
                scale_x = orig_w / self.input_size
                scale_y = orig_h / self.input_size
                
                x1 = int(x1 * scale_x)
                y1 = int(y1 * scale_y)
                x2 = int(x2 * scale_x)
                y2 = int(y2 * scale_y)
                
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'confidence': float(conf),
                    'class_id': int(cls),
                    'class_name': self._get_class_name(int(cls))
                })
            
            batch_results.append(detections)
        
        return batch_results
    
    def _get_class_name(self, class_id: int) -> str:
        coco_names = [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
            'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
            'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
            'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
            'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
            'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
            'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
            'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
            'hair drier', 'toothbrush'
        ]
        return coco_names[class_id] if class_id < len(coco_names) else f'class_{class_id}'
    
    def _nms(self, boxes: np.ndarray, scores: np.ndarray, iou_threshold: float) -> List[int]:
        if len(boxes) == 0:
            return []
        
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        
        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = scores.argsort()[::-1]
        
        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            
            w = np.maximum(0.0, xx2 - xx1 + 1)
            h = np.maximum(0.0, yy2 - yy1 + 1)
            
            inter = w * h
            ovr = inter / (areas[i] + areas[order[1:]] - inter)
            
            inds = np.where(ovr <= iou_threshold)[0]
            order = order[inds + 1]
        
        return keep
    
    def detect_batch(self, images: List[np.ndarray]) -> List[List[dict]]:
        if len(images) == 0:
            return []
        
        original_shapes = [(img.shape[0], img.shape[1]) for img in images]
        
        if TENSORRT_AVAILABLE and self.engine is not None:
            return self._detect_trt(images, original_shapes)
        else:
            return self._detect_fallback(images, original_shapes)
    
    def _detect_trt(self, images: List[np.ndarray], original_shapes: List[Tuple[int, int]]) -> List[List[dict]]:
        batch_size = min(len(images), self.max_batch_size)
        input_data = self._preprocess(images)
        
        self.inputs[0]['host'] = np.ascontiguousarray(input_data.ravel())
        cuda.memcpy_htod_async(self.inputs[0]['device'], self.inputs[0]['host'], self.stream)
        
        self.context.execute_async_v2(bindings=self.bindings, stream_handle=self.stream.handle)
        
        for out in self.outputs:
            cuda.memcpy_dtoh_async(out['host'], out['device'], self.stream)
        
        self.stream.synchronize()
        
        output = self.outputs[0]['host'].reshape(batch_size, -1, 85)
        
        batch_results = []
        for batch_idx in range(batch_size):
            preds = output[batch_idx]
            
            boxes = []
            scores = []
            class_ids = []
            
            for pred in preds:
                obj_conf = pred[4]
                if obj_conf < self.conf_threshold:
                    continue
                
                class_scores = pred[5:]
                class_id = np.argmax(class_scores)
                class_conf = class_scores[class_id]
                conf = obj_conf * class_conf
                
                if conf < self.conf_threshold:
                    continue
                
                cx, cy, w, h = pred[:4]
                x1 = cx - w / 2
                y1 = cy - h / 2
                x2 = cx + w / 2
                y2 = cy + h / 2
                
                boxes.append([x1, y1, x2, y2])
                scores.append(conf)
                class_ids.append(class_id)
            
            if len(boxes) > 0:
                boxes = np.array(boxes)
                scores = np.array(scores)
                class_ids = np.array(class_ids)
                
                keep = self._nms(boxes, scores, self.iou_threshold)
                boxes = boxes[keep]
                scores = scores[keep]
                class_ids = class_ids[keep]
                
                detections = []
                for box, score, cls in zip(boxes, scores, class_ids):
                    orig_h, orig_w = original_shapes[batch_idx]
                    scale_x = orig_w / self.input_size
                    scale_y = orig_h / self.input_size
                    
                    x1 = int(box[0] * scale_x)
                    y1 = int(box[1] * scale_y)
                    x2 = int(box[2] * scale_x)
                    y2 = int(box[3] * scale_y)
                    
                    x1 = max(0, x1)
                    y1 = max(0, y1)
                    x2 = min(orig_w, x2)
                    y2 = min(orig_h, y2)
                    
                    detections.append({
                        'bbox': [x1, y1, x2, y2],
                        'confidence': float(score),
                        'class_id': int(cls),
                        'class_name': self._get_class_name(int(cls))
                    })
                batch_results.append(detections)
            else:
                batch_results.append([])
        
        return batch_results
    
    def _detect_fallback(self, images: List[np.ndarray], original_shapes: List[Tuple[int, int]]) -> List[List[dict]]:
        batch_results = []
        
        for batch_idx, img in enumerate(images):
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            detections = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                if w > 30 and h > 30:
                    detections.append({
                        'bbox': [x, y, x + w, y + h],
                        'confidence': 0.85,
                        'class_id': 0,
                        'class_name': 'object'
                    })
            
            batch_results.append(detections[:10])
        
        return batch_results
