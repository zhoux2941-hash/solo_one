import os
import shutil
from PyQt5.QtWidgets import (QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
                             QFileDialog, QMessageBox, QAction, QStatusBar,
                             QLabel, QToolBar, QSplitter)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QKeySequence, QIcon

from src.image_processor import ImageProcessor
from src.history_manager import HistoryManager
from src.project_manager import ProjectManager
from src.image_viewer import ImageViewer
from src.tool_panel import ToolPanel
from src.batch_export_dialog import BatchExportDialog


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.image_processor = ImageProcessor()
        self.history_manager = HistoryManager(max_history=50)
        self.current_project_path = None
        self.modified = False
        self.original_image_path = None
        
        self.init_ui()
        self.init_menu()
        self.init_toolbar()
        self.connect_signals()
        self.update_status()
    
    def init_ui(self):
        self.setWindowTitle("老照片上色与修复工具")
        self.setMinimumSize(1200, 800)
        self.resize(1400, 900)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        splitter = QSplitter(Qt.Horizontal)
        
        self.image_viewer = ImageViewer()
        self.tool_panel = ToolPanel()
        
        splitter.addWidget(self.image_viewer)
        splitter.addWidget(self.tool_panel)
        splitter.setSizes([1000, 300])
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 0)
        
        main_layout.addWidget(splitter)
        
        self.image_viewer.set_image_processor(self.image_processor)
        
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_label = QLabel("就绪")
        self.status_bar.addWidget(self.status_label)
        
        self.image_info_label = QLabel("")
        self.status_bar.addPermanentWidget(self.image_info_label)
    
    def init_menu(self):
        menubar = self.menuBar()
        
        file_menu = menubar.addMenu("文件(&F)")
        
        open_action = QAction("打开照片(&O)...", self)
        open_action.setShortcut(QKeySequence.Open)
        open_action.triggered.connect(self.open_image)
        file_menu.addAction(open_action)
        
        file_menu.addSeparator()
        
        save_project_action = QAction("保存项目(&S)", self)
        save_project_action.setShortcut(QKeySequence.Save)
        save_project_action.triggered.connect(self.save_project)
        file_menu.addAction(save_project_action)
        
        save_project_as_action = QAction("项目另存为(&A)...", self)
        save_project_as_action.setShortcut("Ctrl+Shift+S")
        save_project_as_action.triggered.connect(self.save_project_as)
        file_menu.addAction(save_project_as_action)
        
        open_project_action = QAction("打开项目(&L)...", self)
        open_project_action.setShortcut("Ctrl+O")
        open_project_action.triggered.connect(self.open_project)
        file_menu.addAction(open_project_action)
        
        file_menu.addSeparator()
        
        export_action = QAction("导出为JPEG(&E)...", self)
        export_action.setShortcut("Ctrl+E")
        export_action.triggered.connect(self.export_image)
        file_menu.addAction(export_action)
        
        batch_export_action = QAction("批量导出(&B)...", self)
        batch_export_action.setShortcut("Ctrl+Shift+E")
        batch_export_action.triggered.connect(self.batch_export)
        file_menu.addAction(batch_export_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("退出(&X)", self)
        exit_action.setShortcut(QKeySequence.Quit)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        edit_menu = menubar.addMenu("编辑(&E)")
        
        undo_action = QAction("撤销(&U)", self)
        undo_action.setShortcut(QKeySequence.Undo)
        undo_action.triggered.connect(self.undo)
        edit_menu.addAction(undo_action)
        
        redo_action = QAction("重做(&R)", self)
        redo_action.setShortcut(QKeySequence.Redo)
        redo_action.triggered.connect(self.redo)
        edit_menu.addAction(redo_action)
        
        edit_menu.addSeparator()
        
        clear_mask_action = QAction("清除所有上色(&C)", self)
        clear_mask_action.triggered.connect(self.clear_color_mask)
        edit_menu.addAction(clear_mask_action)
        
        help_menu = menubar.addMenu("帮助(&H)")
        about_action = QAction("关于(&A)", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
        
        self.undo_action = undo_action
        self.redo_action = redo_action
        self.update_edit_actions()
    
    def init_toolbar(self):
        toolbar = QToolBar("主工具栏")
        self.addToolBar(toolbar)
        
        open_action = QAction("打开", self)
        open_action.triggered.connect(self.open_image)
        toolbar.addAction(open_action)
        
        save_action = QAction("保存项目", self)
        save_action.triggered.connect(self.save_project)
        toolbar.addAction(save_action)
        
        toolbar.addSeparator()
        
        undo_action = QAction("撤销", self)
        undo_action.triggered.connect(self.undo)
        toolbar.addAction(undo_action)
        
        redo_action = QAction("重做", self)
        redo_action.triggered.connect(self.redo)
        toolbar.addAction(redo_action)
        
        toolbar.addSeparator()
        
        export_action = QAction("导出", self)
        export_action.triggered.connect(self.export_image)
        toolbar.addAction(export_action)
        
        batch_export_action = QAction("批量导出", self)
        batch_export_action.triggered.connect(self.batch_export)
        toolbar.addAction(batch_export_action)
        
        self.toolbar_undo_action = undo_action
        self.toolbar_redo_action = redo_action
        self.update_edit_actions()
    
    def connect_signals(self):
        self.tool_panel.tool_changed.connect(self.on_tool_changed)
        self.tool_panel.brush_size_changed.connect(self.on_brush_size_changed)
        self.tool_panel.brush_color_changed.connect(self.on_brush_color_changed)
        self.tool_panel.brush_opacity_changed.connect(self.on_brush_opacity_changed)
        
        self.tool_panel.undo_btn.clicked.connect(self.undo)
        self.tool_panel.redo_btn.clicked.connect(self.redo)
        
        self.image_viewer.edit_started.connect(self.on_edit_started)
        self.image_viewer.image_edited.connect(self.on_image_edited)
    
    def on_tool_changed(self, tool):
        self.image_viewer.set_tool(tool)
        self.update_status(f"当前工具: {tool}")
    
    def on_brush_size_changed(self, size):
        self.image_processor.set_brush_size(size)
        self.image_viewer.set_brush_size(size)
    
    def on_brush_color_changed(self, color):
        self.image_processor.set_brush_color(color)
        self.image_viewer.set_brush_color(color)
    
    def on_brush_opacity_changed(self, opacity):
        self.image_processor.set_brush_opacity(opacity)
        self.image_viewer.set_brush_opacity(opacity)
    
    def on_edit_started(self):
        state = self.image_processor.save_state()
        self.history_manager.push(state)
        self.update_edit_actions()
    
    def on_image_edited(self):
        self.modified = True
        self.update_window_title()
        self.update_status("图像已修改")
    
    def undo(self):
        if not self.history_manager.can_undo():
            return
        
        current_state = self.image_processor.save_state()
        new_state = self.history_manager.undo(current_state)
        if new_state:
            self.image_processor.restore_state(new_state)
            self.image_viewer.update_display()
            self.modified = True
            self.update_window_title()
            self.update_edit_actions()
            self.update_status("已撤销")
    
    def redo(self):
        if not self.history_manager.can_redo():
            return
        
        current_state = self.image_processor.save_state()
        new_state = self.history_manager.redo(current_state)
        if new_state:
            self.image_processor.restore_state(new_state)
            self.image_viewer.update_display()
            self.modified = True
            self.update_window_title()
            self.update_edit_actions()
            self.update_status("已重做")
    
    def clear_color_mask(self):
        if self.image_processor.color_mask is None:
            return
        
        reply = QMessageBox.question(
            self, "确认",
            "确定要清除所有上色吗？此操作不可撤销。",
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.on_edit_started()
            import numpy as np
            self.image_processor.color_mask = np.zeros_like(self.image_processor.color_mask)
            self.image_viewer.update_display()
            self.on_image_edited()
    
    def update_edit_actions(self):
        can_undo = self.history_manager.can_undo()
        can_redo = self.history_manager.can_redo()
        
        self.undo_action.setEnabled(can_undo)
        self.redo_action.setEnabled(can_redo)
        self.toolbar_undo_action.setEnabled(can_undo)
        self.toolbar_redo_action.setEnabled(can_redo)
        self.tool_panel.set_undo_enabled(can_undo)
        self.tool_panel.set_redo_enabled(can_redo)
    
    def update_status(self, message=None):
        if message:
            self.status_label.setText(message)
        else:
            self.status_label.setText("就绪")
    
    def update_image_info(self):
        if self.image_processor.original_image is not None:
            h, w = self.image_processor.original_image.shape[:2]
            self.image_info_label.setText(f"图像尺寸: {w} x {h}")
        else:
            self.image_info_label.setText("")
    
    def update_window_title(self):
        title = "老照片上色与修复工具"
        if self.current_project_path:
            name = os.path.basename(self.current_project_path)
            title = f"{name} - {title}"
        if self.modified:
            title = f"* {title}"
        self.setWindowTitle(title)
    
    def open_image(self):
        if self.modified:
            if not self.check_save_changes():
                return
        
        file_path, _ = QFileDialog.getOpenFileName(
            self, "选择照片", "",
            "图像文件 (*.jpg *.jpeg *.png *.bmp *.tiff *.tif)"
        )
        
        if not file_path:
            return
        
        if self.image_processor.load_image(file_path):
            self.original_image_path = file_path
            self.history_manager.clear()
            self.current_project_path = None
            self.modified = False
            self.image_viewer.set_image_processor(self.image_processor)
            self.image_viewer.update_display()
            self.update_image_info()
            self.update_window_title()
            self.update_edit_actions()
            self.update_status(f"已加载: {os.path.basename(file_path)}")
        else:
            QMessageBox.critical(self, "错误", "无法加载图像文件")
    
    def open_project(self):
        if self.modified:
            if not self.check_save_changes():
                return
        
        file_path, _ = QFileDialog.getOpenFileName(
            self, "打开项目", "",
            "项目文件 (*.json)"
        )
        
        if not file_path:
            return
        
        if ProjectManager.load_project(file_path, self.image_processor, self.history_manager):
            self.current_project_path = file_path
            self.modified = False
            self.image_viewer.set_image_processor(self.image_processor)
            self.image_viewer.update_display()
            self.update_image_info()
            self.update_window_title()
            self.update_edit_actions()
            self.update_status(f"已打开项目: {os.path.basename(file_path)}")
        else:
            QMessageBox.critical(self, "错误", "无法加载项目文件")
    
    def save_project(self):
        if not self.current_project_path:
            return self.save_project_as()
        
        if ProjectManager.save_project(self.current_project_path, self.image_processor, self.history_manager):
            self.modified = False
            self.update_window_title()
            self.update_status(f"项目已保存: {os.path.basename(self.current_project_path)}")
            return True
        else:
            QMessageBox.critical(self, "错误", "保存项目失败")
            return False
    
    def save_project_as(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "保存项目", "",
            "项目文件 (*.json)"
        )
        
        if not file_path:
            return False
        
        if not file_path.endswith('.json'):
            file_path += '.json'
        
        if ProjectManager.save_project(file_path, self.image_processor, self.history_manager):
            self.current_project_path = file_path
            self.modified = False
            self.update_window_title()
            self.update_status(f"项目已保存: {os.path.basename(file_path)}")
            return True
        else:
            QMessageBox.critical(self, "错误", "保存项目失败")
            return False
    
    def export_image(self):
        if self.image_processor.processed_image is None:
            QMessageBox.warning(self, "提示", "请先打开一张照片")
            return
        
        default_name = "彩色照片.jpg"
        if self.original_image_path:
            base = os.path.splitext(os.path.basename(self.original_image_path))[0]
            default_name = f"{base}_colorized.jpg"
        
        file_path, _ = QFileDialog.getSaveFileName(
            self, "导出为JPEG", default_name,
            "JPEG文件 (*.jpg *.jpeg)"
        )
        
        if not file_path:
            return
        
        if not (file_path.endswith('.jpg') or file_path.endswith('.jpeg')):
            file_path += '.jpg'
        
        if self.original_image_path and os.path.exists(self.original_image_path):
            dir_path = os.path.dirname(file_path)
            original_backup = os.path.join(dir_path, f"original_{os.path.basename(self.original_image_path)}")
            if self.original_image_path != original_backup:
                try:
                    shutil.copy2(self.original_image_path, original_backup)
                except:
                    pass
        
        if self.image_processor.export_image(file_path):
            self.update_status(f"已导出: {file_path}")
            QMessageBox.information(self, "成功", f"照片已成功导出到:\n{file_path}")
        else:
            QMessageBox.critical(self, "错误", "导出失败")
    
    def batch_export(self):
        dialog = BatchExportDialog(self)
        dialog.exec_()
    
    def check_save_changes(self):
        reply = QMessageBox.question(
            self, "保存更改",
            "当前项目有未保存的更改，是否保存？",
            QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel
        )
        
        if reply == QMessageBox.Yes:
            return self.save_project()
        elif reply == QMessageBox.Cancel:
            return False
        return True
    
    def show_about(self):
        QMessageBox.about(
            self, "关于",
            "老照片上色与修复工具 v1.0\n\n"
            "功能:\n"
            "- 手工上色黑白照片\n"
            "- 修复照片划痕\n"
            "- 支持撤销/重做\n"
            "- 保存和加载项目\n"
            "- 导出为彩色JPEG\n\n"
            "技术: Python + PyQt5 + OpenCV + NumPy"
        )
    
    def closeEvent(self, event):
        if self.modified:
            if not self.check_save_changes():
                event.ignore()
                return
        event.accept()
