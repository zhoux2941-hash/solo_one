from PyQt5.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QPushButton, QSlider, QColorDialog, QGroupBox,
                             QButtonGroup, QRadioButton, QComboBox, QSpinBox,
                             QFrame)
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QColor, QIcon, QPixmap, QPainter, QPen


class ToolPanel(QWidget):
    tool_changed = pyqtSignal(str)
    brush_size_changed = pyqtSignal(int)
    brush_color_changed = pyqtSignal(tuple)
    brush_opacity_changed = pyqtSignal(float)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_tool = 'paint'
        self.brush_size = 10
        self.brush_color = (0, 128, 255)
        self.brush_opacity = 0.6
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        layout.setContentsMargins(10, 10, 10, 10)
        
        tools_group = QGroupBox("工具")
        tools_layout = QVBoxLayout(tools_group)
        
        self.paint_btn = QRadioButton("上色画笔")
        self.paint_btn.setChecked(True)
        self.paint_btn.toggled.connect(lambda: self.on_tool_changed('paint'))
        
        self.heal_btn = QRadioButton("划痕修复笔")
        self.heal_btn.toggled.connect(lambda: self.on_tool_changed('heal'))
        
        tools_layout.addWidget(self.paint_btn)
        tools_layout.addWidget(self.heal_btn)
        
        brush_group = QGroupBox("画笔设置")
        brush_layout = QVBoxLayout(brush_group)
        
        size_layout = QHBoxLayout()
        size_label = QLabel("画笔大小:")
        self.size_slider = QSlider(Qt.Horizontal)
        self.size_slider.setRange(1, 100)
        self.size_slider.setValue(self.brush_size)
        self.size_slider.valueChanged.connect(self.on_size_changed)
        self.size_value = QLabel(str(self.brush_size))
        self.size_value.setFixedWidth(30)
        
        size_layout.addWidget(size_label)
        size_layout.addWidget(self.size_slider)
        size_layout.addWidget(self.size_value)
        
        opacity_layout = QHBoxLayout()
        opacity_label = QLabel("画笔透明度:")
        self.opacity_slider = QSlider(Qt.Horizontal)
        self.opacity_slider.setRange(10, 100)
        self.opacity_slider.setValue(int(self.brush_opacity * 100))
        self.opacity_slider.valueChanged.connect(self.on_opacity_changed)
        self.opacity_value = QLabel(f"{int(self.brush_opacity * 100)}%")
        self.opacity_value.setFixedWidth(40)
        
        opacity_layout.addWidget(opacity_label)
        opacity_layout.addWidget(self.opacity_slider)
        opacity_layout.addWidget(self.opacity_value)
        
        color_layout = QHBoxLayout()
        color_label = QLabel("画笔颜色:")
        self.color_btn = QPushButton()
        self.color_btn.setFixedSize(50, 30)
        self.color_btn.clicked.connect(self.choose_color)
        self.update_color_button()
        
        color_layout.addWidget(color_label)
        color_layout.addWidget(self.color_btn)
        color_layout.addStretch()
        
        quick_colors_label = QLabel("快速选色:")
        quick_colors_layout = QHBoxLayout()
        self.quick_colors = [
            QColor(255, 0, 0), QColor(0, 255, 0), QColor(0, 0, 255),
            QColor(255, 255, 0), QColor(255, 0, 255), QColor(0, 255, 255),
            QColor(255, 128, 0), QColor(128, 0, 255), QColor(0, 0, 0),
            QColor(255, 255, 255), QColor(192, 192, 192), QColor(128, 128, 128)
        ]
        
        for color in self.quick_colors:
            btn = QPushButton()
            btn.setFixedSize(25, 25)
            btn.setStyleSheet(f"background-color: {color.name()}; border: 1px solid #888;")
            btn.clicked.connect(lambda checked, c=color: self.set_quick_color(c))
            quick_colors_layout.addWidget(btn)
        
        brush_layout.addLayout(size_layout)
        brush_layout.addLayout(opacity_layout)
        brush_layout.addLayout(color_layout)
        brush_layout.addWidget(quick_colors_label)
        brush_layout.addLayout(quick_colors_layout)
        
        actions_group = QGroupBox("操作")
        actions_layout = QVBoxLayout(actions_group)
        
        self.undo_btn = QPushButton("撤销 (Ctrl+Z)")
        self.undo_btn.setEnabled(False)
        self.redo_btn = QPushButton("重做 (Ctrl+Y)")
        self.redo_btn.setEnabled(False)
        
        actions_layout.addWidget(self.undo_btn)
        actions_layout.addWidget(self.redo_btn)
        
        preview_group = QGroupBox("画笔预览")
        preview_layout = QVBoxLayout(preview_group)
        self.brush_preview = QLabel()
        self.brush_preview.setFixedSize(120, 120)
        self.brush_preview.setAlignment(Qt.AlignCenter)
        self.brush_preview.setStyleSheet("border: 1px solid #888; background-color: #f0f0f0;")
        self.update_brush_preview()
        
        preview_layout.addWidget(self.brush_preview, 0, Qt.AlignCenter)
        
        layout.addWidget(tools_group)
        layout.addWidget(brush_group)
        layout.addWidget(actions_group)
        layout.addWidget(preview_group)
        layout.addStretch()
    
    def on_tool_changed(self, tool):
        if self.sender().isChecked():
            self.current_tool = tool
            self.tool_changed.emit(tool)
    
    def on_size_changed(self, value):
        self.brush_size = value
        self.size_value.setText(str(value))
        self.brush_size_changed.emit(value)
        self.update_brush_preview()
    
    def on_opacity_changed(self, value):
        self.brush_opacity = value / 100.0
        self.opacity_value.setText(f"{value}%")
        self.brush_opacity_changed.emit(self.brush_opacity)
        self.update_brush_preview()
    
    def choose_color(self):
        color = QColorDialog.getColor(QColor(*self.brush_color), self, "选择颜色")
        if color.isValid():
            self.brush_color = (color.blue(), color.green(), color.red())
            self.update_color_button()
            self.brush_color_changed.emit(self.brush_color)
            self.update_brush_preview()
    
    def set_quick_color(self, color):
        self.brush_color = (color.blue(), color.green(), color.red())
        self.update_color_button()
        self.brush_color_changed.emit(self.brush_color)
        self.update_brush_preview()
    
    def update_color_button(self):
        r, g, b = self.brush_color[2], self.brush_color[1], self.brush_color[0]
        self.color_btn.setStyleSheet(f"background-color: rgb({r}, {g}, {b}); border: 1px solid #888;")
    
    def update_brush_preview(self):
        pixmap = QPixmap(120, 120)
        pixmap.fill(Qt.white)
        painter = QPainter(pixmap)
        
        painter.setPen(Qt.NoPen)
        r, g, b = self.brush_color[2], self.brush_color[1], self.brush_color[0]
        color = QColor(r, g, b, int(self.brush_opacity * 255))
        painter.setBrush(color)
        painter.drawEllipse(60 - self.brush_size, 60 - self.brush_size, 
                           self.brush_size * 2, self.brush_size * 2)
        
        painter.end()
        self.brush_preview.setPixmap(pixmap)
    
    def set_undo_enabled(self, enabled):
        self.undo_btn.setEnabled(enabled)
    
    def set_redo_enabled(self, enabled):
        self.redo_btn.setEnabled(enabled)
