import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import os

class CharacterGenerator:
    def __init__(self, fonts_dir="fonts"):
        self.fonts_dir = fonts_dir
        self.font_map = {
            '楷体': 'KaiTi.ttf',
            '楷书': 'KaiTi.ttf',
            '行书': 'XingShu.ttf',
            '隶书': 'LiShu.ttf',
            '宋体': 'SimSun.ttf'
        }

    def load_font(self, font_name, font_size):
        font_file = self.font_map.get(font_name, 'KaiTi.ttf')
        font_path = os.path.join(self.fonts_dir, font_file)

        if not os.path.exists(font_path):
            if font_name in ['楷体', '楷书']:
                available_fonts = ['simkai.ttf', 'KaiTi.ttf', 'STKAITI.TTF']
                for f in available_fonts:
                    check_path = os.path.join(self.fonts_dir, f)
                    if os.path.exists(check_path):
                        font_path = check_path
                        break

        try:
            font = ImageFont.truetype(font_path, font_size)
        except (IOError, OSError):
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/simkai.ttf", font_size)
            except (IOError, OSError):
                font = ImageFont.load_default()
        return font

    def draw_mizi_grid(self, draw, x, y, size, color=(200, 200, 200), grid_color=(255, 100, 100)):
        half = size // 2
        cx, cy = x + half, y + half

        draw.rectangle([x, y, x + size, y + size], outline=color, width=2)

        draw.line([(cx, y), (cx, y + size)], fill=grid_color, width=1)
        draw.line([(x, cy), (x + size, cy)], fill=grid_color, width=1)

        draw.line([(x, y), (x + size, y + size)], fill=grid_color, width=1)
        draw.line([(x + size, y), (x, y + size)], fill=grid_color, width=1)

    def draw_stroke_arrow(self, draw, start, end, color=(255, 0, 0)):
        draw.line([start, end], fill=color, width=3)

        angle = np.arctan2(end[1] - start[1], end[0] - start[0])
        arrow_size = 12
        arrow_angle = np.pi / 6

        left_angle = angle + np.pi + arrow_angle
        right_angle = angle + np.pi - arrow_angle

        left_point = (
            end[0] + int(arrow_size * np.cos(left_angle)),
            end[1] + int(arrow_size * np.sin(left_angle))
        )
        right_point = (
            end[0] + int(arrow_size * np.cos(right_angle)),
            end[1] + int(arrow_size * np.sin(right_angle))
        )

        draw.polygon([end, left_point, right_point], fill=color)

    def generate_character_image(self, character, font_name='楷体', grid_size=200, 
                                  show_grid=True, show_stroke_guide=True):
        margin = 20
        img_size = grid_size + 2 * margin
        img = Image.new('RGB', (img_size, img_size), 'white')
        draw = ImageDraw.Draw(img)

        if show_grid:
            self.draw_mizi_grid(draw, margin, margin, grid_size)

        font_size = int(grid_size * 0.85)
        font = self.load_font(font_name, font_size)

        bbox = draw.textbbox((0, 0), character, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        text_x = margin + (grid_size - text_width) // 2 - bbox[0]
        text_y = margin + (grid_size - text_height) // 2 - bbox[1]

        draw.text((text_x, text_y), character, fill='black', font=font)

        if show_stroke_guide:
            self._draw_dynamic_stroke_guides(img, draw, margin, margin, grid_size, character, font)

        return img

    def _draw_dynamic_stroke_guides(self, img, draw, x, y, size, character, font):
        temp_img = Image.new('L', (size, size), 255)
        temp_draw = ImageDraw.Draw(temp_img)
        
        font_size = int(size * 0.85)
        bbox = temp_draw.textbbox((0, 0), character, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = (size - text_width) // 2 - bbox[0]
        text_y = (size - text_height) // 2 - bbox[1]
        
        temp_draw.text((text_x, text_y), character, fill=0, font=font)
        
        img_array = np.array(temp_img)
        _, binary = cv2.threshold(img_array, 128, 255, cv2.THRESH_BINARY_INV)
        
        kernel = np.ones((3, 3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        skeleton = self._extract_skeleton_opencv(binary)
        
        endpoints = self._find_endpoints(skeleton)
        
        if len(endpoints) >= 2:
            arrow_paths = self._compute_arrow_paths(skeleton, endpoints, binary)
            
            for path in arrow_paths:
                if len(path) >= 2:
                    scaled_path = [(x + int(px), y + int(py)) for px, py in path]
                    
                    for i in range(len(scaled_path) - 1):
                        if i == len(scaled_path) - 2:
                            self.draw_stroke_arrow(draw, scaled_path[i], scaled_path[i + 1])
                        else:
                            draw.line([scaled_path[i], scaled_path[i + 1]], 
                                     fill=(255, 0, 0), width=2)

    def _extract_skeleton_opencv(self, binary):
        binary = binary // 255
        binary = binary.astype(np.uint8)
        
        size = np.size(binary)
        skel = np.zeros(binary.shape, np.uint8)
        
        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        
        while True:
            open_img = cv2.morphologyEx(binary, cv2.MORPH_OPEN, element)
            temp = binary - open_img
            eroded = cv2.erode(binary, element)
            skel = skel | temp
            binary = eroded
            
            zeros = size - cv2.countNonZero(binary)
            if zeros == size:
                break
        
        return skel * 255

    def _find_endpoints(self, skeleton):
        endpoints = []
        rows, cols = skeleton.shape
        
        for i in range(1, rows - 1):
            for j in range(1, cols - 1):
                if skeleton[i, j] > 0:
                    neighbors = 0
                    for di in [-1, 0, 1]:
                        for dj in [-1, 0, 1]:
                            if di == 0 and dj == 0:
                                continue
                            if skeleton[i + di, j + dj] > 0:
                                neighbors += 1
                    
                    if neighbors == 1:
                        endpoints.append((j, i))
        
        return endpoints

    def _compute_arrow_paths(self, skeleton, endpoints, binary):
        if len(endpoints) < 2:
            return []
        
        paths = []
        
        if len(endpoints) <= 8:
            selected_endpoints = endpoints
        else:
            selected_endpoints = self._select_representative_endpoints(endpoints, binary)
        
        used_points = set()
        
        for i, start in enumerate(selected_endpoints):
            if start in used_points:
                continue
                
            path = self._trace_stroke(skeleton, start)
            
            if path and len(path) > 5:
                paths.append(path)
                for p in path:
                    used_points.add(p)
        
        if not paths and len(selected_endpoints) >= 2:
            for i in range(0, min(len(selected_endpoints), 8) - 1, 2):
                if i + 1 < len(selected_endpoints):
                    start = selected_endpoints[i]
                    end = selected_endpoints[i + 1]
                    
                    mid_x = (start[0] + end[0]) // 2
                    mid_y = (start[1] + end[1]) // 2
                    
                    paths.append([start, (mid_x, mid_y), end])
        
        return paths[:8]

    def _select_representative_endpoints(self, endpoints, binary):
        if len(endpoints) <= 8:
            return endpoints
        
        rows, cols = binary.shape
        cell_size = max(rows, cols) // 3
        
        cells = {}
        
        for pt in endpoints:
            cell_x = pt[0] // cell_size
            cell_y = pt[1] // cell_size
            cell_key = (cell_x, cell_y)
            
            if cell_key not in cells:
                cells[cell_key] = []
            cells[cell_key].append(pt)
        
        selected = []
        for cell_key, pts in cells.items():
            if pts:
                center_x = sum(p[0] for p in pts) / len(pts)
                center_y = sum(p[1] for p in pts) / len(pts)
                selected.append((int(center_x), int(center_y)))
        
        if len(selected) > 8:
            selected = selected[:8]
        
        return selected

    def _trace_stroke(self, skeleton, start):
        path = [start]
        current = start
        visited = {start}
        
        directions = [(-1, -1), (-1, 0), (-1, 1),
                     (0, -1),          (0, 1),
                     (1, -1),  (1, 0), (1, 1)]
        
        max_steps = 100
        
        for _ in range(max_steps):
            found_next = False
            
            for dx, dy in directions:
                nx, ny = current[0] + dx, current[1] + dy
                
                if (nx, ny) in visited:
                    continue
                
                if 0 <= nx < skeleton.shape[1] and 0 <= ny < skeleton.shape[0]:
                    if skeleton[ny, nx] > 0:
                        path.append((nx, ny))
                        visited.add((nx, ny))
                        current = (nx, ny)
                        found_next = True
                        break
            
            if not found_next:
                break
        
        return path if len(path) > 3 else None

    def _get_stroke_guides(self, character):
        common_strokes = {
            '一': [[(0.15, 0.5), (0.85, 0.5)]],
            '二': [[(0.2, 0.3), (0.8, 0.3)], [(0.15, 0.7), (0.85, 0.7)]],
            '三': [[(0.2, 0.2), (0.8, 0.2)], [(0.25, 0.5), (0.75, 0.5)], [(0.15, 0.8), (0.85, 0.8)]],
            '十': [[(0.15, 0.5), (0.85, 0.5)], [(0.5, 0.15), (0.5, 0.85)]],
            '人': [[(0.3, 0.2), (0.7, 0.8)], [(0.7, 0.2), (0.3, 0.8)]],
            '大': [[(0.15, 0.45), (0.85, 0.45)], [(0.3, 0.15), (0.7, 0.85)], [(0.7, 0.15), (0.3, 0.85)]],
            '小': [[(0.5, 0.2), (0.5, 0.7)], [(0.5, 0.5), (0.2, 0.8)], [(0.5, 0.5), (0.8, 0.8)]],
            '口': [[(0.2, 0.25), (0.8, 0.25)], [(0.8, 0.25), (0.8, 0.75)], 
                   [(0.8, 0.75), (0.2, 0.75)], [(0.2, 0.75), (0.2, 0.25)]],
            '日': [[(0.2, 0.2), (0.8, 0.2)], [(0.8, 0.2), (0.8, 0.8)], 
                   [(0.8, 0.8), (0.2, 0.8)], [(0.2, 0.8), (0.2, 0.2)], 
                   [(0.2, 0.5), (0.8, 0.5)]],
            '月': [[(0.3, 0.15), (0.7, 0.15)], [(0.7, 0.15), (0.7, 0.85)], 
                   [(0.7, 0.85), (0.3, 0.75)], [(0.3, 0.75), (0.3, 0.15)], 
                   [(0.3, 0.4), (0.7, 0.4)], [(0.3, 0.65), (0.7, 0.65)]],
            '水': [[(0.5, 0.15), (0.5, 0.85)], [(0.5, 0.4), (0.2, 0.7)], 
                   [(0.5, 0.4), (0.8, 0.7)], [(0.5, 0.6), (0.3, 0.85)], 
                   [(0.5, 0.6), (0.7, 0.85)]],
            '火': [[(0.3, 0.3), (0.2, 0.8)], [(0.7, 0.3), (0.8, 0.8)], 
                   [(0.5, 0.15), (0.5, 0.7)], [(0.5, 0.4), (0.7, 0.6)], 
                   [(0.5, 0.4), (0.3, 0.6)]],
            '木': [[(0.15, 0.45), (0.85, 0.45)], [(0.5, 0.15), (0.5, 0.85)], 
                   [(0.5, 0.45), (0.25, 0.8)], [(0.5, 0.45), (0.75, 0.8)]],
            '山': [[(0.2, 0.75), (0.2, 0.3)], [(0.2, 0.3), (0.5, 0.15)], 
                   [(0.5, 0.15), (0.5, 0.75)], [(0.5, 0.15), (0.8, 0.3)], 
                   [(0.8, 0.3), (0.8, 0.75)], [(0.2, 0.75), (0.8, 0.75)]],
            '田': [[(0.2, 0.2), (0.8, 0.2)], [(0.8, 0.2), (0.8, 0.8)], 
                   [(0.8, 0.8), (0.2, 0.8)], [(0.2, 0.8), (0.2, 0.2)], 
                   [(0.2, 0.5), (0.8, 0.5)], [(0.5, 0.2), (0.5, 0.8)]],
            '中': [[(0.5, 0.15), (0.5, 0.85)], [(0.3, 0.3), (0.7, 0.3)], 
                   [(0.7, 0.3), (0.7, 0.7)], [(0.7, 0.7), (0.3, 0.7)], 
                   [(0.3, 0.7), (0.3, 0.3)]],
            '上': [[(0.5, 0.2), (0.5, 0.8)], [(0.2, 0.5), (0.8, 0.5)], 
                   [(0.3, 0.8), (0.7, 0.8)]],
            '下': [[(0.5, 0.2), (0.5, 0.8)], [(0.3, 0.2), (0.7, 0.2)], 
                   [(0.2, 0.5), (0.8, 0.5)]]
        }
        return common_strokes.get(character, [])

    def generate_traceable_copybook(self, characters, font_name='楷体', 
                                      cols=8, rows=11, cell_size=80, 
                                      show_guide=True):
        margin = 30
        spacing = 10

        total_width = margin * 2 + cols * cell_size + (cols - 1) * spacing
        total_height = margin * 2 + rows * cell_size + (rows - 1) * spacing

        img = Image.new('RGB', (total_width, total_height), 'white')
        draw = ImageDraw.Draw(img)

        font_size = int(cell_size * 0.85)
        font = self.load_font(font_name, font_size)

        for idx, char in enumerate(characters):
            if idx >= cols * rows:
                break

            row = idx // cols
            col = idx % cols

            x = margin + col * (cell_size + spacing)
            y = margin + row * (cell_size + spacing)

            if show_guide:
                self.draw_mizi_grid(draw, x, y, cell_size)

            bbox = draw.textbbox((0, 0), char, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            text_x = x + (cell_size - text_width) // 2 - bbox[0]
            text_y = y + (cell_size - text_height) // 2 - bbox[1]

            if idx < cols:
                draw.text((text_x, text_y), char, fill='black', font=font)
            else:
                draw.text((text_x, text_y), char, fill=(200, 200, 200), font=font)

        return img

    def save_image(self, img, filepath):
        img.save(filepath, 'PNG')

    def image_to_base64(self, img):
        import io
        import base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
