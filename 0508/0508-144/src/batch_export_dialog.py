import os
import cv2
from PyQt5.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QListWidget, 
                             QListWidgetItem, QPushButton, QLabel, QFileDialog,
                             QMessageBox, QProgressBar, QCheckBox, QGroupBox,
                             QSpinBox, QWidget, QSplitter)
from PyQt5.QtCore import Qt, QThread, pyqtSignal

from src.image_processor import ImageProcessor
from src.project_manager import ProjectManager


class ExportWorker(QThread):
    progress = pyqtSignal(int, int, str)
    finished = pyqtSignal(list, list)
    
    def __init__(self, project_files, output_dir, export_original=True, quality=95):
        super().__init__()
        self.project_files = project_files
        self.output_dir = output_dir
        self.export_original = export_original
        self.quality = quality
        self.success_files = []
        self.failed_files = []
    
    def run(self):
        total = len(self.project_files)
        processor = ImageProcessor()
        
        for i, project_path in enumerate(self.project_files):
            try:
                base_name = os.path.splitext(os.path.basename(project_path))[0]
                self.progress.emit(i, total, f"正在处理: {base_name}")
                
                if not ProjectManager.load_project(project_path, processor):
                    self.failed_files.append((project_path, "无法加载项目文件"))
                    continue
                
                output_path = os.path.join(self.output_dir, f"{base_name}_colorized.jpg")
                
                if self.export_original and processor.original_image is not None:
                    original_backup = os.path.join(self.output_dir, f"original_{base_name}.jpg")
                    cv2.imwrite(original_backup, processor.original_image, 
                               [cv2.IMWRITE_JPEG_QUALITY, self.quality])
                
                if processor.export_image(output_path, self.quality):
                    self.success_files.append((project_path, output_path))
                else:
                    self.failed_files.append((project_path, "导出失败"))
                    
            except Exception as e:
                self.failed_files.append((project_path, str(e)))
        
        self.progress.emit(total, total, "处理完成")
        self.finished.emit(self.success_files, self.failed_files)


class BatchExportDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("批量导出")
        self.setMinimumSize(700, 500)
        self.resize(800, 600)
        self.project_files = []
        self.worker = None
        
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        layout.setContentsMargins(15, 15, 15, 15)
        
        info_label = QLabel("选择要批量导出的项目文件（.json）")
        info_label.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout.addWidget(info_label)
        
        splitter = QSplitter(Qt.Vertical)
        
        files_group = QGroupBox("项目文件列表")
        files_layout = QVBoxLayout(files_group)
        
        list_label = QLabel("已选择的项目文件:")
        files_layout.addWidget(list_label)
        
        self.file_list = QListWidget()
        self.file_list.setSelectionMode(QListWidget.ExtendedSelection)
        files_layout.addWidget(self.file_list)
        
        list_buttons_layout = QHBoxLayout()
        self.add_btn = QPushButton("添加项目...")
        self.add_btn.clicked.connect(self.add_files)
        self.remove_btn = QPushButton("移除选中")
        self.remove_btn.clicked.connect(self.remove_selected)
        self.clear_btn = QPushButton("清空列表")
        self.clear_btn.clicked.connect(self.clear_list)
        
        list_buttons_layout.addWidget(self.add_btn)
        list_buttons_layout.addWidget(self.remove_btn)
        list_buttons_layout.addWidget(self.clear_btn)
        list_buttons_layout.addStretch()
        
        files_layout.addLayout(list_buttons_layout)
        
        settings_group = QGroupBox("导出设置")
        settings_layout = QVBoxLayout(settings_group)
        
        output_layout = QHBoxLayout()
        output_label = QLabel("输出目录:")
        self.output_path_edit = QLabel("（未选择）")
        self.output_path_edit.setStyleSheet("color: #888;")
        self.browse_output_btn = QPushButton("浏览...")
        self.browse_output_btn.clicked.connect(self.select_output_dir)
        
        output_layout.addWidget(output_label)
        output_layout.addWidget(self.output_path_edit, 1)
        output_layout.addWidget(self.browse_output_btn)
        
        settings_layout.addLayout(output_layout)
        
        options_layout = QHBoxLayout()
        self.export_original_cb = QCheckBox("同时导出原始照片备份")
        self.export_original_cb.setChecked(True)
        
        quality_layout = QHBoxLayout()
        quality_label = QLabel("JPEG质量:")
        self.quality_spin = QSpinBox()
        self.quality_spin.setRange(1, 100)
        self.quality_spin.setValue(95)
        self.quality_spin.setSuffix("%")
        
        quality_layout.addWidget(quality_label)
        self.quality_spin.setFixedWidth(80)
        quality_layout.addWidget(self.quality_spin)
        
        options_layout.addWidget(self.export_original_cb)
        options_layout.addStretch()
        options_layout.addLayout(quality_layout)
        
        settings_layout.addLayout(options_layout)
        
        splitter.addWidget(files_group)
        splitter.addWidget(settings_group)
        splitter.setSizes([350, 150])
        
        layout.addWidget(splitter, 1)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        self.status_label = QLabel("")
        self.status_label.setStyleSheet("color: #666;")
        layout.addWidget(self.status_label)
        
        buttons_layout = QHBoxLayout()
        buttons_layout.addStretch()
        
        self.export_btn = QPushButton("开始导出")
        self.export_btn.setMinimumWidth(120)
        self.export_btn.clicked.connect(self.start_export)
        
        self.close_btn = QPushButton("关闭")
        self.close_btn.clicked.connect(self.close)
        
        buttons_layout.addWidget(self.export_btn)
        buttons_layout.addWidget(self.close_btn)
        
        layout.addLayout(buttons_layout)
    
    def add_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self, "选择项目文件", "",
            "项目文件 (*.json)"
        )
        
        if not files:
            return
        
        existing_paths = set()
        for i in range(self.file_list.count()):
            existing_paths.add(self.file_list.item(i).data(Qt.UserRole))
        
        added_count = 0
        for file_path in files:
            if file_path not in existing_paths:
                item = QListWidgetItem(os.path.basename(file_path))
                item.setData(Qt.UserRole, file_path)
                item.setToolTip(file_path)
                self.file_list.addItem(item)
                existing_paths.add(file_path)
                added_count += 1
        
        if added_count > 0:
            self.update_status(f"已添加 {added_count} 个项目文件")
    
    def remove_selected(self):
        selected = self.file_list.selectedItems()
        for item in selected:
            self.file_list.takeItem(self.file_list.row(item))
        
        if not selected:
            return
        
        remaining = self.file_list.count()
        self.update_status(f"已移除 {len(selected)} 个，剩余 {remaining} 个")
    
    def clear_list(self):
        if self.file_list.count() == 0:
            return
        
        reply = QMessageBox.question(
            self, "确认",
            "确定要清空列表吗？",
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.file_list.clear()
            self.update_status("列表已清空")
    
    def select_output_dir(self):
        dir_path = QFileDialog.getExistingDirectory(self, "选择输出目录")
        
        if dir_path:
            self.output_path_edit.setText(dir_path)
            self.output_path_edit.setStyleSheet("color: #000;")
            self.update_status(f"输出目录: {dir_path}")
    
    def get_selected_files(self):
        files = []
        for i in range(self.file_list.count()):
            files.append(self.file_list.item(i).data(Qt.UserRole))
        return files
    
    def update_status(self, message):
        self.status_label.setText(message)
    
    def start_export(self):
        project_files = self.get_selected_files()
        output_dir = self.output_path_edit.text()
        
        if not project_files:
            QMessageBox.warning(self, "提示", "请先添加项目文件")
            return
        
        if output_dir == "（未选择）":
            QMessageBox.warning(self, "提示", "请选择输出目录")
            return
        
        if not os.path.exists(output_dir):
            reply = QMessageBox.question(
                self, "确认",
                f"输出目录不存在，是否创建？\n{output_dir}",
                QMessageBox.Yes | QMessageBox.No, QMessageBox.Yes
            )
            if reply == QMessageBox.No:
                return
            try:
                os.makedirs(output_dir)
            except Exception as e:
                QMessageBox.critical(self, "错误", f"无法创建目录: {e}")
                return
        
        self.export_btn.setEnabled(False)
        self.add_btn.setEnabled(False)
        self.remove_btn.setEnabled(False)
        self.clear_btn.setEnabled(False)
        self.browse_output_btn.setEnabled(False)
        self.close_btn.setEnabled(False)
        
        self.progress_bar.setVisible(True)
        self.progress_bar.setRange(0, len(project_files))
        self.progress_bar.setValue(0)
        
        self.worker = ExportWorker(
            project_files,
            output_dir,
            self.export_original_cb.isChecked(),
            self.quality_spin.value()
        )
        
        self.worker.progress.connect(self.on_progress)
        self.worker.finished.connect(self.on_export_finished)
        self.worker.start()
    
    def on_progress(self, current, total, message):
        self.progress_bar.setRange(0, total)
        self.progress_bar.setValue(current)
        self.update_status(message)
    
    def on_export_finished(self, success_files, failed_files):
        self.progress_bar.setVisible(False)
        
        self.export_btn.setEnabled(True)
        self.add_btn.setEnabled(True)
        self.remove_btn.setEnabled(True)
        self.clear_btn.setEnabled(True)
        self.browse_output_btn.setEnabled(True)
        self.close_btn.setEnabled(True)
        
        success_count = len(success_files)
        failed_count = len(failed_files)
        
        if failed_count == 0:
            QMessageBox.information(
                self, "成功",
                f"批量导出完成！\n成功导出: {success_count} 个文件"
            )
            self.update_status(f"批量导出完成，成功: {success_count}")
        else:
            failed_list = "\n".join([f"- {os.path.basename(p)}: {err}" 
                                    for p, err in failed_files])
            QMessageBox.warning(
                self, "部分失败",
                f"批量导出完成！\n成功: {success_count}\n失败: {failed_count}\n\n失败的文件:\n{failed_list}"
            )
            self.update_status(f"批量导出完成，成功: {success_count}，失败: {failed_count}")
        
        self.worker = None
