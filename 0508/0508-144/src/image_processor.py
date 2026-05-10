import cv2
import numpy as np


class ImageProcessor:
    def __init__(self):
        self.original_image = None
        self.processed_image = None
        self.color_mask = None
        self.working_image = None
        self.brush_size = 10
        self.brush_color = (0, 128, 255)
        self.brush_opacity = 0.6
    
    def load_image(self, file_path):
        image = cv2.imread(file_path, cv2.IMREAD_COLOR)
        if image is None:
            return False
        
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        
        self.original_image = image.copy()
        self.processed_image = image.copy()
        self.working_image = image.copy()
        self.color_mask = np.zeros((image.shape[0], image.shape[1], 4), dtype=np.uint8)
        self.color_mask[:, :, 3] = 0
        return True
    
    def get_display_image(self):
        if self.processed_image is None:
            return None
        
        display_img = self.processed_image.copy()
        
        if self.color_mask is not None and np.any(self.color_mask[:, :, 3] > 0):
            bgr = self.color_mask[:, :, :3]
            alpha = self.color_mask[:, :, 3:4].astype(np.float32) / 255.0
            display_img = (display_img.astype(np.float32) * (1 - alpha * self.brush_opacity) + 
                          bgr.astype(np.float32) * alpha * self.brush_opacity).astype(np.uint8)
        
        return display_img
    
    def get_final_image(self):
        if self.processed_image is None:
            return None
        
        final_img = self.processed_image.copy()
        
        if self.color_mask is not None and np.any(self.color_mask[:, :, 3] > 0):
            bgr = self.color_mask[:, :, :3]
            alpha = self.color_mask[:, :, 3:4].astype(np.float32) / 255.0
            final_img = (final_img.astype(np.float32) * (1 - alpha) + 
                        bgr.astype(np.float32) * alpha).astype(np.uint8)
        
        return final_img
    
    def _draw_feathered_stroke(self, stroke_mask):
        if self.color_mask is None:
            return
        
        kernel_size = max(3, int(self.brush_size * 0.8) | 1)
        sigma = max(1.0, self.brush_size * 0.3)
        
        blurred_mask = cv2.GaussianBlur(stroke_mask, (kernel_size, kernel_size), sigma)
        blurred_mask = (blurred_mask.astype(np.float32) / 255.0 * 255).astype(np.uint8)
        
        alpha_mask = blurred_mask[:, :, np.newaxis].astype(np.float32) / 255.0
        current_alpha = self.color_mask[:, :, 3:4].astype(np.float32) / 255.0
        new_alpha = 1 - (1 - current_alpha) * (1 - alpha_mask)
        new_alpha = (new_alpha * 255).astype(np.uint8)
        
        color_bgr = np.array(self.brush_color, dtype=np.float32)
        current_bgr = self.color_mask[:, :, :3].astype(np.float32)
        
        blended_bgr = (current_bgr * current_alpha + color_bgr * alpha_mask) / np.maximum(new_alpha.astype(np.float32) / 255.0, 1e-6)
        blended_bgr = np.clip(blended_bgr, 0, 255).astype(np.uint8)
        
        mask_indices = blurred_mask > 0
        self.color_mask[:, :, :3][mask_indices] = blended_bgr[mask_indices]
        self.color_mask[:, :, 3][mask_indices] = new_alpha[:, :, 0][mask_indices]
    
    def paint(self, x, y):
        if self.working_image is None or self.color_mask is None:
            return
        
        stroke_mask = np.zeros(self.color_mask.shape[:2], dtype=np.uint8)
        cv2.circle(stroke_mask, (x, y), self.brush_size, 255, -1)
        
        self._draw_feathered_stroke(stroke_mask)
    
    def paint_line(self, x1, y1, x2, y2):
        if self.working_image is None or self.color_mask is None:
            return
        
        stroke_mask = np.zeros(self.color_mask.shape[:2], dtype=np.uint8)
        cv2.line(stroke_mask, (x1, y1), (x2, y2), 255, self.brush_size * 2)
        
        self._draw_feathered_stroke(stroke_mask)
    
    def heal_scratch(self, x, y):
        if self.processed_image is None:
            return
        
        mask = np.zeros(self.processed_image.shape[:2], dtype=np.uint8)
        cv2.circle(mask, (x, y), self.brush_size, 255, -1)
        self.processed_image = cv2.inpaint(self.processed_image, mask, 3, cv2.INPAINT_TELEA)
    
    def heal_scratch_line(self, x1, y1, x2, y2):
        if self.processed_image is None:
            return
        
        mask = np.zeros(self.processed_image.shape[:2], dtype=np.uint8)
        cv2.line(mask, (x1, y1), (x2, y2), 255, self.brush_size * 2)
        self.processed_image = cv2.inpaint(self.processed_image, mask, 3, cv2.INPAINT_TELEA)
    
    def set_brush_size(self, size):
        self.brush_size = max(1, int(size))
    
    def set_brush_color(self, color):
        self.brush_color = color
    
    def set_brush_opacity(self, opacity):
        self.brush_opacity = max(0.0, min(1.0, opacity))
    
    def save_state(self):
        return {
            'processed': self.processed_image.copy() if self.processed_image is not None else None,
            'color_mask': self.color_mask.copy() if self.color_mask is not None else None
        }
    
    def restore_state(self, state):
        if state['processed'] is not None:
            self.processed_image = state['processed'].copy()
        if state['color_mask'] is not None:
            self.color_mask = state['color_mask'].copy()
    
    def export_image(self, file_path, quality=95):
        final_img = self.get_final_image()
        if final_img is None:
            return False
        return cv2.imwrite(file_path, final_img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    
    def get_original_image(self):
        return self.original_image.copy() if self.original_image is not None else None
