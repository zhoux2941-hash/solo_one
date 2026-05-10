from PyQt5.QtWidgets import QLabel, QScrollArea, QWidget, QVBoxLayout
from PyQt5.QtCore import Qt, QPoint, pyqtSignal, QRect
from PyQt5.QtGui import QImage, QPixmap, QPainter, QPen, QColor, QCursor
import cv2
import numpy as np


class ImageViewer(QScrollArea):
    image_edited = pyqtSignal()
    edit_started = pyqtSignal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWidgetResizable(True)
        self.setAlignment(Qt.AlignCenter)
        
        self.container = QWidget()
        self.layout = QVBoxLayout(self.container)
        self.layout.setContentsMargins(0, 0, 0, 0)
        
        self.image_label = QLabel()
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setMouseTracking(True)
        self.image_label.setMinimumSize(1, 1)
        
        self.layout.addWidget(self.image_label)
        self.setWidget(self.container)
        
        self.image_processor = None
        self.current_tool = 'paint'
        self.drawing = False
        self.last_point = None
        self.scale_factor = 1.0
        self.brush_size = 10
        self.brush_color = (0, 128, 255)
        self.brush_opacity = 0.6
        self.original_image_size = None
        
        self.setStyleSheet("""
            QScrollArea {
                background-color: #333;
                border: none;
            }
            QLabel {
                background-color: #333;
            }
        """)
    
    def set_image_processor(self, processor):
        self.image_processor = processor
        if processor is not None and processor.original_image is not None:
            self.original_image_size = (processor.original_image.shape[1], 
                                       processor.original_image.shape[0])
            self.update_display()
    
    def set_tool(self, tool):
        self.current_tool = tool
        if tool == 'paint':
            self.image_label.setCursor(QCursor(Qt.CrossCursor))
        else:
            self.image_label.setCursor(QCursor(Qt.PointingHandCursor))
    
    def set_brush_size(self, size):
        self.brush_size = size
    
    def set_brush_color(self, color):
        self.brush_color = color
    
    def set_brush_opacity(self, opacity):
        self.brush_opacity = opacity
    
    def update_display(self):
        if self.image_processor is None:
            return
        
        display_img = self.image_processor.get_display_image()
        if display_img is None:
            return
        
        rgb_img = cv2.cvtColor(display_img, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_img.shape
        bytes_per_line = ch * w
        qt_image = QImage(rgb_img.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image)
        
        scaled_pixmap = pixmap.scaled(
            self.image_label.size(),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation
        )
        
        self.image_label.setPixmap(scaled_pixmap)
        self.image_label.setFixedSize(scaled_pixmap.size())
        
        if scaled_pixmap.width() > 0:
            self.scale_factor = pixmap.width() / scaled_pixmap.width()
    
    def get_image_coords(self, pos):
        if self.image_processor is None or self.image_label.pixmap() is None:
            return None
        
        pixmap = self.image_label.pixmap()
        label_rect = self.image_label.rect()
        
        pixmap_rect = QRect(
            (label_rect.width() - pixmap.width()) // 2,
            (label_rect.height() - pixmap.height()) // 2,
            pixmap.width(),
            pixmap.height()
        )
        
        if not pixmap_rect.contains(pos):
            return None
        
        x = int((pos.x() - pixmap_rect.x()) * self.scale_factor)
        y = int((pos.y() - pixmap_rect.y()) * self.scale_factor)
        
        return (x, y)
    
    def mousePressEvent(self, event):
        if self.image_processor is None or event.button() != Qt.LeftButton:
            return
        
        pos = self.image_label.mapFromParent(event.pos())
        coords = self.get_image_coords(pos)
        
        if coords is None:
            return
        
        self.drawing = True
        self.last_point = coords
        self.edit_started.emit()
        
        if self.current_tool == 'paint':
            self.image_processor.paint(*coords)
        else:
            self.image_processor.heal_scratch(*coords)
        
        self.update_display()
        super().mousePressEvent(event)
    
    def mouseMoveEvent(self, event):
        if not self.drawing or self.image_processor is None:
            return
        
        pos = self.image_label.mapFromParent(event.pos())
        coords = self.get_image_coords(pos)
        
        if coords is None or self.last_point is None:
            return
        
        if self.current_tool == 'paint':
            self.image_processor.paint_line(*self.last_point, *coords)
        else:
            self.image_processor.heal_scratch_line(*self.last_point, *coords)
        
        self.last_point = coords
        self.update_display()
        super().mouseMoveEvent(event)
    
    def mouseReleaseEvent(self, event):
        if self.drawing and event.button() == Qt.LeftButton:
            self.drawing = False
            self.last_point = None
            self.image_edited.emit()
        super().mouseReleaseEvent(event)
    
    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.update_display()
