from PyQt5.QtGui import QPainter, QPen, QColor, QImage, QPainterPath
from PyQt5.QtCore import Qt, QPointF, QRectF
import math

class PatternRenderer:
    def __init__(self, width=800, height=600):
        self.width = width
        self.height = height
    
    def render_herringbone(self, warp_count, weft_layers, strip_width=5):
        margin = 40
        area_width = self.width - 2 * margin
        area_height = self.height - 2 * margin
        
        if warp_count <= 0 or weft_layers <= 0:
            warp_count = 20
            weft_layers = 15
        
        warp_spacing = area_width / (warp_count + 1)
        weft_spacing = area_height / (weft_layers + 1)
        
        image = QImage(self.width, self.height, QImage.Format_RGB32)
        image.fill(QColor(255, 250, 240))
        
        painter = QPainter(image)
        painter.setRenderHint(QPainter.Antialiasing)
        
        painter.setPen(QPen(QColor(180, 140, 100), 1))
        for i in range(warp_count + 2):
            x = margin + i * warp_spacing
            painter.drawLine(int(x), margin, int(x), self.height - margin)
        
        painter.setPen(QPen(QColor(139, 90, 43), 2))
        for j in range(1, weft_layers + 1):
            y = margin + j * weft_spacing
            offset = (j % 2) * warp_spacing / 2
            for i in range(0, warp_count, 2):
                x1 = margin + i * warp_spacing + offset
                x2 = margin + (i + 1) * warp_spacing + offset
                if x1 <= self.width - margin and x2 <= self.width - margin:
                    self._draw_herringbone_segment(painter, x1, y, x2, y, warp_spacing / 2)
        
        self._draw_pattern_info(painter, '人字纹 (Herringbone)', warp_count, weft_layers)
        painter.end()
        return image
    
    def _draw_herringbone_segment(self, painter, x1, y, x2, y, segment_height):
        mid_x = (x1 + x2) / 2
        path = QPainterPath()
        path.moveTo(x1, y - segment_height / 2)
        path.lineTo(mid_x, y)
        path.lineTo(x2, y - segment_height / 2)
        painter.drawPath(path)
    
    def render_hexagon(self, warp_count, weft_layers, strip_width=5):
        margin = 40
        area_width = self.width - 2 * margin
        area_height = self.height - 2 * margin
        
        if warp_count <= 0 or weft_layers <= 0:
            warp_count = 20
            weft_layers = 15
        
        hex_radius = min(area_width / (warp_count * 1.5), area_height / (weft_layers * 1.732))
        hex_width = hex_radius * 2
        hex_height = hex_radius * math.sqrt(3)
        
        image = QImage(self.width, self.height, QImage.Format_RGB32)
        image.fill(QColor(255, 250, 240))
        
        painter = QPainter(image)
        painter.setRenderHint(QPainter.Antialiasing)
        
        cols = int(area_width / (hex_width * 0.75))
        rows = int(area_height / hex_height)
        
        painter.setPen(QPen(QColor(139, 90, 43), 1.5))
        for row in range(rows):
            for col in range(cols):
                offset_x = hex_width * 0.75 * col
                offset_y = hex_height * row
                if col % 2 == 1:
                    offset_y += hex_height / 2
                
                center_x = margin + offset_x + hex_radius
                center_y = margin + offset_y + hex_height / 2
                
                if center_x < self.width - margin and center_y < self.height - margin:
                    self._draw_hexagon(painter, center_x, center_y, hex_radius * 0.9)
        
        painter.setPen(QPen(QColor(180, 140, 100), 1, Qt.DashLine))
        for i in range(warp_count + 1):
            x = margin + (area_width / warp_count) * i
            painter.drawLine(int(x), margin, int(x), self.height - margin)
        
        for j in range(weft_layers + 1):
            y = margin + (area_height / weft_layers) * j
            painter.drawLine(margin, int(y), self.width - margin, int(y))
        
        self._draw_pattern_info(painter, '六角眼 (Hexagon Eye)', warp_count, weft_layers)
        painter.end()
        return image
    
    def _draw_hexagon(self, painter, cx, cy, radius):
        points = []
        for i in range(6):
            angle = math.pi / 3 * i - math.pi / 6
            x = cx + radius * math.cos(angle)
            y = cy + radius * math.sin(angle)
            points.append(QPointF(x, y))
        
        path = QPainterPath()
        path.moveTo(points[0])
        for i in range(1, 6):
            path.lineTo(points[i])
        path.closeSubpath()
        painter.drawPath(path)
    
    def render_grid(self, warp_count, weft_layers, weft_per_layer):
        margin = 40
        area_width = self.width - 2 * margin
        area_height = self.height - 2 * margin
        
        if warp_count <= 0 or weft_layers <= 0:
            warp_count = 20
            weft_layers = 15
        
        image = QImage(self.width, self.height, QImage.Format_RGB32)
        image.fill(QColor(255, 250, 240))
        
        painter = QPainter(image)
        painter.setRenderHint(QPainter.Antialiasing)
        
        painter.setPen(QPen(QColor(100, 149, 237), 2))
        for i in range(warp_count + 1):
            x = margin + (area_width / warp_count) * i
            painter.drawLine(int(x), margin, int(x), self.height - margin)
        
        painter.setPen(QPen(QColor(205, 92, 92), 1.5))
        for j in range(weft_layers + 1):
            y = margin + (area_height / weft_layers) * j
            painter.drawLine(margin, int(y), self.width - margin, int(y))
        
        painter.setPen(QPen(QColor(50, 50, 50), 2))
        painter.drawRect(margin, margin, area_width, area_height)
        
        self._draw_grid_info(painter, warp_count, weft_layers, weft_per_layer)
        painter.end()
        return image
    
    def _draw_pattern_info(self, painter, pattern_name, warp_count, weft_layers):
        painter.setPen(QPen(QColor(70, 70, 70), 1))
        painter.drawText(50, 25, f'纹样: {pattern_name}')
        painter.drawText(50, 42, f'经线数: {warp_count}  |  纬线层数: {weft_layers}')
    
    def _draw_grid_info(self, painter, warp_count, weft_layers, weft_per_layer):
        painter.setPen(QPen(QColor(70, 70, 70), 1))
        painter.drawText(50, 25, '编织展开示意图 (网格图)')
        painter.drawText(50, 42, f'经线数: {warp_count}  |  纬线层数: {weft_layers}  |  每层纬线根数: {weft_per_layer}')
        painter.drawText(50, self.height - 20, '蓝色: 经线 (Warp)  |  红色: 纬线 (Weft)')
