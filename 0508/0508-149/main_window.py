import os
import sys
from datetime import datetime
from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLineEdit, QFileDialog, QProgressBar, QTreeWidget, QTreeWidgetItem,
    QLabel, QMessageBox, QSplitter, QHeaderView, QCheckBox, QComboBox,
    QGroupBox, QTextEdit, QDialog, QDialogButtonBox, QTabWidget
)
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QFont, QColor, QBrush

from database import FileDatabase
from scanner import FileScanner
from cleaner import FileCleaner
from exporter import CSVExporter


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("重复文件查找与清理工具")
        self.setGeometry(100, 100, 1400, 800)

        self.db = FileDatabase()
        self.scanner = None
        self.cleaner = None
        self.md5_duplicates = []
        self.similar_images = []
        self.current_view = 'md5'
        self.keep_selections = {}

        self._init_ui()
        self._init_signals()

    def _init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(10)
        main_layout.setContentsMargins(15, 15, 15, 15)

        # 顶部：文件夹选择和操作按钮
        top_group = QGroupBox("扫描设置")
        top_layout = QVBoxLayout(top_group)

        path_layout = QHBoxLayout()
        self.path_edit = QLineEdit()
        self.path_edit.setPlaceholderText("请选择要扫描的文件夹...")
        self.path_edit.setReadOnly(True)
        self.browse_btn = QPushButton("浏览...")
        self.browse_btn.setMinimumWidth(100)
        path_layout.addWidget(QLabel("扫描路径:"))
        path_layout.addWidget(self.path_edit, 1)
        path_layout.addWidget(self.browse_btn)
        top_layout.addLayout(path_layout)

        btn_layout = QHBoxLayout()
        self.scan_btn = QPushButton("开始扫描")
        self.scan_btn.setMinimumHeight(40)
        self.scan_btn.setStyleSheet("font-size: 14px; font-weight: bold;")
        self.stop_btn = QPushButton("停止扫描")
        self.stop_btn.setEnabled(False)
        self.stop_btn.setMinimumHeight(40)
        btn_layout.addWidget(self.scan_btn)
        btn_layout.addWidget(self.stop_btn)
        btn_layout.addStretch()
        top_layout.addLayout(btn_layout)

        main_layout.addWidget(top_group)

        # 进度条区域
        progress_group = QGroupBox("扫描进度")
        progress_layout = QVBoxLayout(progress_group)

        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setFormat("%p% (%v/%m)")
        progress_layout.addWidget(self.progress_bar)

        self.status_label = QLabel("准备就绪")
        self.status_label.setStyleSheet("color: #666;")
        progress_layout.addWidget(self.status_label)

        main_layout.addWidget(progress_group)

        # 统计信息
        stats_group = QGroupBox("统计信息")
        stats_layout = QHBoxLayout(stats_group)

        self.stats_labels = {}
        stats_info = [
            ('md5_groups', 'MD5精确重复组数', '0'),
            ('md5_files', 'MD5精确重复文件数', '0'),
            ('sim_groups', '相似图片组数', '0'),
            ('sim_files', '相似图片数', '0'),
            ('wasted_space', '可释放空间', '0 MB'),
            ('to_delete', '待删除文件', '0')
        ]

        for key, label, default in stats_info:
            lbl = QLabel(f"<b>{label}:</b> {default}")
            lbl.setStyleSheet("font-size: 12px; padding: 5px;")
            stats_layout.addWidget(lbl)
            self.stats_labels[key] = lbl

        main_layout.addWidget(stats_group)

        # 视图切换
        view_group = QGroupBox("结果视图")
        view_layout = QHBoxLayout(view_group)

        self.view_combo = QComboBox()
        self.view_combo.addItems([
            "MD5 精确重复文件（完全相同）",
            "相似图片（感知哈希，可调整大小/格式）"
        ])
        self.view_combo.setMinimumHeight(35)
        self.view_combo.setEnabled(False)
        view_layout.addWidget(QLabel("查看:"))
        view_layout.addWidget(self.view_combo, 1)

        main_layout.addWidget(view_group)

        # 中间：结果列表和操作
        splitter = QSplitter(Qt.Horizontal)

        # 左侧：重复文件树
        results_group = QGroupBox("结果列表")
        results_layout = QVBoxLayout(results_group)

        self.tree = QTreeWidget()
        self.tree.setHeaderLabels(["选择", "文件路径", "大小", "创建时间", "哈希值"])
        self.tree.setColumnCount(5)
        self.tree.header().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.tree.header().setSectionResizeMode(1, QHeaderView.Stretch)
        self.tree.header().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self.tree.header().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.tree.header().setSectionResizeMode(4, QHeaderView.ResizeToContents)
        self.tree.setSelectionMode(QTreeWidget.ExtendedSelection)
        results_layout.addWidget(self.tree)

        splitter.addWidget(results_group)

        # 右侧：操作面板
        action_group = QGroupBox("操作面板")
        action_layout = QVBoxLayout(action_group)

        strategy_layout = QHBoxLayout()
        strategy_layout.addWidget(QLabel("保留策略:"))
        self.strategy_combo = QComboBox()
        self.strategy_combo.addItems([
            "保留最早创建的文件",
            "保留最新创建的文件",
            "保留路径最短的文件",
            "保留最大的文件",
            "全选删除（保留第一份）"
        ])
        strategy_layout.addWidget(self.strategy_combo, 1)
        action_layout.addLayout(strategy_layout)

        quick_select_layout = QHBoxLayout()
        self.select_all_duplicates_btn = QPushButton("选择所有副本(保留第一份)")
        self.select_none_btn = QPushButton("取消所有选择")
        self.invert_selection_btn = QPushButton("反选所有")
        quick_select_layout.addWidget(self.select_all_duplicates_btn)
        quick_select_layout.addWidget(self.select_none_btn)
        quick_select_layout.addWidget(self.invert_selection_btn)
        action_layout.addLayout(quick_select_layout)

        action_btn_layout = QHBoxLayout()
        self.delete_btn = QPushButton("删除选中文件(回收站)")
        self.delete_btn.setMinimumHeight(45)
        self.delete_btn.setStyleSheet("""
            QPushButton {
                background-color: #dc3545;
                color: white;
                font-size: 14px;
                font-weight: bold;
                border-radius: 5px;
            }
            QPushButton:disabled {
                background-color: #ccc;
            }
        """)
        self.delete_btn.setEnabled(False)
        action_btn_layout.addWidget(self.delete_btn)
        action_layout.addLayout(action_btn_layout)

        export_group = QGroupBox("导出报告")
        export_layout = QVBoxLayout(export_group)

        export_btn_layout1 = QHBoxLayout()
        self.export_md5_btn = QPushButton("导出MD5重复(CSV)")
        self.export_sim_btn = QPushButton("导出相似图片(CSV)")
        self.export_md5_btn.setEnabled(False)
        self.export_sim_btn.setEnabled(False)
        export_btn_layout1.addWidget(self.export_md5_btn)
        export_btn_layout1.addWidget(self.export_sim_btn)
        export_layout.addLayout(export_btn_layout1)

        export_btn_layout2 = QHBoxLayout()
        self.export_summary_btn = QPushButton("导出完整统计(CSV)")
        self.export_summary_btn.setEnabled(False)
        export_btn_layout2.addWidget(self.export_summary_btn)
        export_layout.addLayout(export_btn_layout2)

        action_layout.addWidget(export_group)

        action_layout.addStretch()

        splitter.addWidget(action_group)
        splitter.setSizes([900, 400])

        main_layout.addWidget(splitter, 1)

        log_group = QGroupBox("操作日志")
        log_layout = QVBoxLayout(log_group)
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(150)
        log_layout.addWidget(self.log_text)
        main_layout.addWidget(log_group)

    def _init_signals(self):
        self.browse_btn.clicked.connect(self._browse_folder)
        self.scan_btn.clicked.connect(self._start_scan)
        self.stop_btn.clicked.connect(self._stop_scan)

        self.view_combo.currentIndexChanged.connect(self._on_view_changed)
        self.strategy_combo.currentIndexChanged.connect(self._apply_selection_strategy)
        self.select_all_duplicates_btn.clicked.connect(self._select_all_duplicates)
        self.select_none_btn.clicked.connect(self._select_none)
        self.invert_selection_btn.clicked.connect(self._invert_selection)

        self.delete_btn.clicked.connect(self._delete_selected)
        self.export_md5_btn.clicked.connect(self._export_md5)
        self.export_sim_btn.clicked.connect(self._export_similar)
        self.export_summary_btn.clicked.connect(self._export_summary)

        self.tree.itemChanged.connect(self._on_item_changed)

    def _browse_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "选择扫描文件夹", "")
        if folder:
            self.path_edit.setText(folder)

    def _log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.append(f"[{timestamp}] {message}")

    def _start_scan(self):
        folder = self.path_edit.text().strip()
        if not folder:
            QMessageBox.warning(self, "提示", "请先选择要扫描的文件夹")
            return

        if not os.path.isdir(folder):
            QMessageBox.warning(self, "提示", "选择的路径不是有效的文件夹")
            return

        self.md5_duplicates = []
        self.similar_images = []
        self.keep_selections = {}
        self.tree.clear()
        self._update_stats(0, 0, 0, 0, 0, 0)
        self._set_controls_enabled(False)

        self.scanner = FileScanner(folder, self.db)
        self.scanner.scan_progress.connect(self._on_scan_progress)
        self.scanner.scan_completed.connect(self._on_scan_completed)
        self.scanner.scan_error.connect(self._on_scan_error)
        self.scanner.start()

        self._log(f"开始扫描: {folder}")

    def _stop_scan(self):
        if self.scanner:
            self.scanner.stop()
            self._log("正在停止扫描...")

    def _on_scan_progress(self, current, total, message):
        self.status_label.setText(message)
        if total > 0:
            self.progress_bar.setMaximum(total)
            self.progress_bar.setValue(current)
        else:
            self.progress_bar.setMaximum(0)
            self.progress_bar.setValue(current)

    def _on_scan_completed(self, result):
        self.md5_duplicates = result.get('md5_duplicates', [])
        self.similar_images = result.get('similar_images', [])

        self._set_controls_enabled(True)

        md5_files = sum(len(g['files']) for g in self.md5_duplicates)
        md5_groups = len(self.md5_duplicates)
        sim_files = sum(len(g['files']) for g in self.similar_images)
        sim_groups = len(self.similar_images)
        total_wasted = sum(g['wasted_space'] for g in self.md5_duplicates) + sum(g['wasted_space'] for g in self.similar_images)

        self._update_stats(md5_groups, md5_files, sim_groups, sim_files, total_wasted, 0)

        self._log(f"扫描完成！MD5重复: {md5_groups}组/{md5_files}个, 相似图片: {sim_groups}组/{sim_files}个")

        if md5_files > 0 or sim_files > 0:
            if md5_files > 0:
                self.view_combo.setCurrentIndex(0)
                self._switch_view('md5')
            elif sim_files > 0:
                self.view_combo.setCurrentIndex(1)
                self._switch_view('similar')
        else:
            QMessageBox.information(self, "扫描完成", "未发现重复文件或相似图片！")

    def _on_scan_error(self, error):
        self._set_controls_enabled(True)
        self._log(f"扫描错误: {error}")
        QMessageBox.critical(self, "错误", error)

    def _on_view_changed(self, index):
        if index == 0:
            self._switch_view('md5')
        else:
            self._switch_view('similar')

    def _switch_view(self, view_type):
        self.current_view = view_type
        self._populate_tree()
        self._apply_selection_strategy()

    def _get_current_groups(self):
        if self.current_view == 'md5':
            return self.md5_duplicates
        else:
            return self.similar_images

    def _populate_tree(self):
        groups = self._get_current_groups()
        self.tree.blockSignals(True)
        self.tree.clear()

        for group_idx, group in enumerate(groups):
            if self.current_view == 'md5':
                hash_value = group['md5']
            else:
                hash_value = f"组{group_idx+1} (平均距离: {group.get('avg_hamming_distance', 0):.1f})"

            size = group['size']
            files = group['files']

            group_item = QTreeWidgetItem(self.tree)
            group_item.setText(0, "")
            group_item.setText(1, f"组 {group_idx + 1}: {len(files)} 个文件")
            group_item.setText(2, self._format_size(size))
            group_item.setText(4, hash_value[:30] + "..." if len(hash_value) > 30 else hash_value)
            group_item.setData(0, Qt.UserRole, {"type": "group", "index": group_idx})
            group_item.setExpanded(True)

            for file_idx, file_info in enumerate(files):
                file_item = QTreeWidgetItem(group_item)
                file_item.setFlags(file_item.flags() | Qt.ItemIsUserCheckable)
                file_item.setCheckState(0, Qt.Unchecked)

                file_item.setText(1, file_info['path'])
                file_item.setText(2, self._format_size(file_info['size']))
                file_item.setText(3, datetime.fromtimestamp(file_info['created_time']).strftime('%Y-%m-%d %H:%M:%S'))

                if self.current_view == 'md5':
                    file_item.setText(4, group['md5'][:16] + "..." if len(group['md5']) > 16 else group['md5'])
                else:
                    file_item.setText(4, file_info.get('dhash', '')[:12])

                file_item.setData(0, Qt.UserRole, {
                    "type": "file",
                    "group_index": group_idx,
                    "file_index": file_idx,
                    "path": file_info['path'],
                    "size": file_info['size'],
                    "created_time": file_info['created_time']
                })

                if file_idx == 0:
                    file_item.setForeground(1, QBrush(QColor("#007bff")))
                    font = file_item.font(1)
                    font.setBold(True)
                    file_item.setFont(1, font)

        self.tree.blockSignals(False)

    def _apply_selection_strategy(self):
        groups = self._get_current_groups()
        if not groups:
            return

        strategy = self.strategy_combo.currentIndex()
        self.tree.blockSignals(True)

        for group_idx in range(self.tree.topLevelItemCount()):
            group_item = self.tree.topLevelItem(group_idx)
            keep_idx = 0

            files_info = []
            for i in range(group_item.childCount()):
                child = group_item.child(i)
                data = child.data(0, Qt.UserRole)
                files_info.append((i, data))

            if strategy == 1:
                files_info.sort(key=lambda x: x[1]['created_time'], reverse=True)
                keep_idx = files_info[0][0]
            elif strategy == 2:
                files_info.sort(key=lambda x: len(x[1]['path']))
                keep_idx = files_info[0][0]
            elif strategy == 3:
                files_info.sort(key=lambda x: x[1]['size'], reverse=True)
                keep_idx = files_info[0][0]

            for i in range(group_item.childCount()):
                child = group_item.child(i)
                if i == keep_idx:
                    child.setCheckState(0, Qt.Unchecked)
                else:
                    child.setCheckState(0, Qt.Checked)

        self.tree.blockSignals(False)
        self._count_selected()

    def _select_all_duplicates(self):
        self.tree.blockSignals(True)
        for group_idx in range(self.tree.topLevelItemCount()):
            group_item = self.tree.topLevelItem(group_idx)
            for i in range(group_item.childCount()):
                child = group_item.child(i)
                if i == 0:
                    child.setCheckState(0, Qt.Unchecked)
                else:
                    child.setCheckState(0, Qt.Checked)
        self.tree.blockSignals(False)
        self._count_selected()

    def _select_none(self):
        self.tree.blockSignals(True)
        for group_idx in range(self.tree.topLevelItemCount()):
            group_item = self.tree.topLevelItem(group_idx)
            for i in range(group_item.childCount()):
                child = group_item.child(i)
                child.setCheckState(0, Qt.Unchecked)
        self.tree.blockSignals(False)
        self._count_selected()

    def _invert_selection(self):
        self.tree.blockSignals(True)
        for group_idx in range(self.tree.topLevelItemCount()):
            group_item = self.tree.topLevelItem(group_idx)
            for i in range(group_item.childCount()):
                child = group_item.child(i)
                current = child.checkState(0)
                child.setCheckState(0, Qt.Checked if current == Qt.Unchecked else Qt.Unchecked)
        self.tree.blockSignals(False)
        self._count_selected()

    def _on_item_changed(self, item, column):
        if column != 0:
            return
        self._count_selected()

    def _count_selected(self):
        count = 0
        for group_idx in range(self.tree.topLevelItemCount()):
            group_item = self.tree.topLevelItem(group_idx)
            for i in range(group_item.childCount()):
                child = group_item.child(i)
                if child.checkState(0) == Qt.Checked:
                    count += 1

        self.stats_labels['to_delete'].setText(f"<b>待删除文件:</b> {count}")
        self.delete_btn.setEnabled(count > 0)

        has_md5 = len(self.md5_duplicates) > 0
        has_sim = len(self.similar_images) > 0
        self.export_md5_btn.setEnabled(has_md5)
        self.export_sim_btn.setEnabled(has_sim)
        self.export_summary_btn.setEnabled(has_md5 or has_sim)

        return count

    def _get_selected_files(self):
        files = []
        for group_idx in range(self.tree.topLevelItemCount()):
            group_item = self.tree.topLevelItem(group_idx)
            for i in range(group_item.childCount()):
                child = group_item.child(i)
                if child.checkState(0) == Qt.Checked:
                    data = child.data(0, Qt.UserRole)
                    files.append(data['path'])
        return files

    def _delete_selected(self):
        files_to_delete = self._get_selected_files()
        if not files_to_delete:
            return

        reply = QMessageBox.question(
            self,
            "确认删除",
            f"确定要将 {len(files_to_delete)} 个文件移动到回收站吗？\n\n注意：这不会永久删除文件，您可以从回收站恢复。",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply != QMessageBox.Yes:
            return

        self._set_controls_enabled(False, scan_only=True)
        self._log(f"开始删除 {len(files_to_delete)} 个文件...")

        self.cleaner = FileCleaner(files_to_delete, self.db)
        self.cleaner.clean_progress.connect(self._on_clean_progress)
        self.cleaner.clean_completed.connect(self._on_clean_completed)
        self.cleaner.clean_error.connect(self._on_clean_error)
        self.cleaner.start()

    def _on_clean_progress(self, current, total, message):
        self.status_label.setText(message)
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(current)

    def _on_clean_completed(self, success, failed):
        self._set_controls_enabled(True)
        self._log(f"删除完成！成功: {success}, 失败: {failed}")

        if failed > 0:
            QMessageBox.warning(self, "删除完成", f"删除完成！\n成功: {success} 个\n失败: {failed} 个")
        else:
            QMessageBox.information(self, "删除完成", f"删除完成！\n成功删除 {success} 个文件到回收站")

        self._refresh_after_clean()

    def _on_clean_error(self, error):
        self._log(f"删除错误: {error}")

    def _refresh_after_clean(self):
        for groups in [self.md5_duplicates, self.similar_images]:
            to_remove = []
            for group_idx, group in enumerate(groups):
                remaining = []
                for f in group['files']:
                    if os.path.exists(f['path']):
                        remaining.append(f)

                if len(remaining) <= 1:
                    to_remove.append(group_idx)
                else:
                    group['files'] = remaining
                    group['wasted_space'] = (len(remaining) - 1) * remaining[0]['size']

            for idx in reversed(to_remove):
                del groups[idx]

        self._populate_tree()
        self._apply_selection_strategy()

        md5_files = sum(len(g['files']) for g in self.md5_duplicates)
        md5_groups = len(self.md5_duplicates)
        sim_files = sum(len(g['files']) for g in self.similar_images)
        sim_groups = len(self.similar_images)
        total_wasted = sum(g['wasted_space'] for g in self.md5_duplicates) + sum(g['wasted_space'] for g in self.similar_images)
        self._update_stats(md5_groups, md5_files, sim_groups, sim_files, total_wasted, 0)

    def _export_md5(self):
        if not self.md5_duplicates:
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "保存MD5重复报告",
            f"MD5重复报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "CSV 文件 (*.csv)"
        )

        if file_path:
            success, message = CSVExporter.export_md5_duplicates(self.md5_duplicates, file_path)
            if success:
                self._log(message)
                QMessageBox.information(self, "导出成功", message)
            else:
                self._log(message)
                QMessageBox.critical(self, "导出失败", message)

    def _export_similar(self):
        if not self.similar_images:
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "保存相似图片报告",
            f"相似图片报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "CSV 文件 (*.csv)"
        )

        if file_path:
            success, message = CSVExporter.export_similar_images(self.similar_images, file_path)
            if success:
                self._log(message)
                QMessageBox.information(self, "导出成功", message)
            else:
                self._log(message)
                QMessageBox.critical(self, "导出失败", message)

    def _export_summary(self):
        if not self.md5_duplicates and not self.similar_images:
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "保存完整统计",
            f"扫描统计_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "CSV 文件 (*.csv)"
        )

        if file_path:
            success, message = CSVExporter.export_summary(self.md5_duplicates, self.similar_images, file_path)
            if success:
                self._log(message)
                QMessageBox.information(self, "导出成功", message)
            else:
                self._log(message)
                QMessageBox.critical(self, "导出失败", message)

    def _update_stats(self, md5_groups, md5_files, sim_groups, sim_files, wasted, to_delete):
        self.stats_labels['md5_groups'].setText(f"<b>MD5精确重复组数:</b> {md5_groups}")
        self.stats_labels['md5_files'].setText(f"<b>MD5精确重复文件数:</b> {md5_files}")
        self.stats_labels['sim_groups'].setText(f"<b>相似图片组数:</b> {sim_groups}")
        self.stats_labels['sim_files'].setText(f"<b>相似图片数:</b> {sim_files}")
        self.stats_labels['wasted_space'].setText(f"<b>可释放空间:</b> {self._format_size(wasted)}")
        self.stats_labels['to_delete'].setText(f"<b>待删除文件:</b> {to_delete}")

    def _format_size(self, size_bytes):
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

    def _set_controls_enabled(self, enabled, scan_only=False):
        self.browse_btn.setEnabled(enabled)
        self.scan_btn.setEnabled(enabled)
        self.stop_btn.setEnabled(not enabled)
        self.path_edit.setEnabled(enabled)

        if not scan_only:
            has_data = len(self.md5_duplicates) > 0 or len(self.similar_images) > 0
            self.view_combo.setEnabled(enabled and has_data)
            self.delete_btn.setEnabled(enabled and self._count_selected() > 0)
            self.export_md5_btn.setEnabled(enabled and len(self.md5_duplicates) > 0)
            self.export_sim_btn.setEnabled(enabled and len(self.similar_images) > 0)
            self.export_summary_btn.setEnabled(enabled and has_data)
            self.strategy_combo.setEnabled(enabled and has_data)
            self.select_all_duplicates_btn.setEnabled(enabled and has_data)
            self.select_none_btn.setEnabled(enabled and has_data)
            self.invert_selection_btn.setEnabled(enabled and has_data)

    def closeEvent(self, event):
        if self.scanner and self.scanner.isRunning():
            self.scanner.stop()
            self.scanner.wait(2000)

        if self.cleaner and self.cleaner.isRunning():
            self.cleaner.stop()
            self.cleaner.wait(2000)

        if self.db:
            self.db.close()

        event.accept()
