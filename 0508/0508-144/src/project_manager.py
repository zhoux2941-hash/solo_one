import json
import os
import base64
import numpy as np
import cv2


class ProjectManager:
    VERSION = "1.0"
    
    @staticmethod
    def encode_image(img):
        if img is None:
            return None
        retval, buffer = cv2.imencode('.png', img)
        return base64.b64encode(buffer).decode('utf-8')
    
    @staticmethod
    def decode_image(encoded):
        if encoded is None:
            return None
        buffer = base64.b64decode(encoded.encode('utf-8'))
        img_array = np.frombuffer(buffer, dtype=np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_UNCHANGED)
    
    @staticmethod
    def save_project(file_path, image_processor, history_manager=None):
        project_data = {
            'version': ProjectManager.VERSION,
            'original_image': ProjectManager.encode_image(image_processor.original_image),
            'processed_image': ProjectManager.encode_image(image_processor.processed_image),
            'color_mask': ProjectManager.encode_image(image_processor.color_mask),
            'brush_size': image_processor.brush_size,
            'brush_color': list(image_processor.brush_color),
            'brush_opacity': image_processor.brush_opacity,
        }
        
        if history_manager:
            project_data['undo_history'] = [
                {
                    'processed': ProjectManager.encode_image(state['processed']),
                    'color_mask': ProjectManager.encode_image(state['color_mask'])
                }
                for state in history_manager.undo_stack
            ]
            project_data['redo_history'] = [
                {
                    'processed': ProjectManager.encode_image(state['processed']),
                    'color_mask': ProjectManager.encode_image(state['color_mask'])
                }
                for state in history_manager.redo_stack
            ]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(project_data, f)
        
        return True
    
    @staticmethod
    def load_project(file_path, image_processor, history_manager=None):
        if not os.path.exists(file_path):
            return False
        
        with open(file_path, 'r', encoding='utf-8') as f:
            project_data = json.load(f)
        
        if project_data.get('version') != ProjectManager.VERSION:
            return False
        
        image_processor.original_image = ProjectManager.decode_image(project_data.get('original_image'))
        image_processor.processed_image = ProjectManager.decode_image(project_data.get('processed_image'))
        image_processor.color_mask = ProjectManager.decode_image(project_data.get('color_mask'))
        image_processor.brush_size = project_data.get('brush_size', 10)
        image_processor.brush_color = tuple(project_data.get('brush_color', [0, 128, 255]))
        image_processor.brush_opacity = project_data.get('brush_opacity', 0.6)
        
        if history_manager:
            history_manager.clear()
            undo_history = project_data.get('undo_history', [])
            redo_history = project_data.get('redo_history', [])
            
            for state in undo_history:
                history_manager.undo_stack.append({
                    'processed': ProjectManager.decode_image(state.get('processed')),
                    'color_mask': ProjectManager.decode_image(state.get('color_mask'))
                })
            
            for state in redo_history:
                history_manager.redo_stack.append({
                    'processed': ProjectManager.decode_image(state.get('processed')),
                    'color_mask': ProjectManager.decode_image(state.get('color_mask'))
                })
        
        return True
