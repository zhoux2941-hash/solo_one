import os
import cv2
import numpy as np
from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFileDialog,
    QMessageBox, QGroupBox, QComboBox, QSlider, QCheckBox, QProgressBar,
    QSplitter, QWidget, QScrollArea
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QImage, QPixmap, QFont

from image_matcher import WearComparator, get_latest_after_photo


class ComparisonWorker(QThread):
    finished = pyqtSignal(dict)
    error = pyqtSignal(str)
    progress = pyqtSignal(int, str)
    
    def __init__(self, comparator, base_path, new_path, threshold, min_area):
        super().__init__()
        self.comparator = comparator
        self.base_path = base_path
        self.new_path = new_path
        self.threshold = threshold
        self.min_area = min_area
    
    def run(self):
        try:
            self.progress.emit(10, "加载图片...")
            
            base_img, err = self.comparator.load_image(self.base_path)
            if err:
                self.error.emit(f"历史照片: {err}")
                return
            
            new_img, err = self.comparator.load_image(self.new_path)
            if err:
                self.error.emit(f"当前照片: {err}")
                return
            
            self.progress.emit(30, "提取SIFT特征...")
            
            kp1, desc1, err = self.comparator.extract_features(base_img)
            if err:
                self.error.emit(f"历史照片特征提取: {err}")
                return
            
            kp2, desc2, err = self.comparator.extract_features(new_img)
            if err:
                self.error.emit(f"当前照片特征提取: {err}")
                return
            
            self.progress.emit(50, "特征匹配中...")
            
            matches, err = self.comparator.match_features(desc1, desc2)
            if err:
                self.error.emit(f"特征匹配: {err}")
                return
            
            self.progress.emit(70, "图像对齐中...")
            
            aligned, warn = self.comparator.align_images(base_img, new_img, kp1, kp2, matches)
            if aligned is None:
                aligned = base_img
                match_quality = '无法对齐，使用原图对比'
            elif warn:
                match_quality = warn
            else:
                match_quality = f"匹配成功 ({len(matches)} 个特征点)"
            
            self.progress.emit(85, "检测划痕差异...")
            
            scratches, diff, binary = self.comparator.detect_scratches(
                aligned, new_img, 
                threshold=self.threshold, 
                min_area=self.min_area
            )
            
            marked = self.comparator.mark_scratches(new_img.copy(), scratches)
            
            self.progress.emit(100, "完成！")
            
            results = {
                'success': True,
                'base_image': base_img,
                'new_image': new_img,
                'aligned_image': aligned,
                'marked_image': marked,
                'scratches': scratches,
                'num_matches': len(matches),
                'match_quality': match_quality
            }
            
            self.finished.emit(results)
            
        except Exception as e:
            self.error.emit(f"处理出错: {str(e)}")


class WearCompareDialog(QDialog):
    def __init__(self, parent=None, db=None, sword_id=None):
        super().__init__(parent)
        self.db = db
        self.sword_id = sword_id
        self.comparator = WearComparator()
        self.worker = None
        self.results = None
        
        self.setWindowTitle('磨损痕迹对比分析')
        self.setMinimumSize(1000, 700)
        
        self._init_ui()
        self._load_history_photos()
    
    def _init_ui(self):
        layout = QVBoxLayout(self)
        
        control_group = QGroupBox('对比设置')
        control_layout = QVBoxLayout(control_group)
        
        photo_layout = QHBoxLayout()
        
        history_layout = QVBoxLayout()
        history_layout.addWidget(QLabel('历史照片（保养后）:'))
        self.history_combo = QComboBox()
        self.history_combo.setMinimumWidth(250)
        history_layout.addWidget(self.history_combo)
        self.history_browse_btn = QPushButton('选择其他...')
        self.history_browse_btn.clicked.connect(self._browse_history)
        history_layout.addWidget(self.history_browse_btn)
        photo_layout.addLayout(history_layout)
        
        current_layout = QVBoxLayout()
        current_layout.addWidget(QLabel('当前照片（保养前）:'))
        self.current_combo = QComboBox()
        self.current_combo.setMinimumWidth(250)
        current_layout.addWidget(self.current_combo)
        self.current_browse_btn = QPushButton('选择文件...')
        self.current_browse_btn.clicked.connect(self._browse_current)
        current_layout.addWidget(self.current_browse_btn)
        photo_layout.addLayout(current_layout)
        
        control_layout.addLayout(photo_layout)
        
        param_layout = QHBoxLayout()
        
        threshold_layout = QVBoxLayout()
        threshold_layout.addWidget(QLabel('检测敏感度（值越低越敏感）:'))
        self.threshold_slider = QSlider(Qt.Horizontal)
        self.threshold_slider.setRange(10, 60)
        self.threshold_slider.setValue(30)
        self.threshold_label = QLabel('30')
        self.threshold_label.setMinimumWidth(30)
        t_layout = QHBoxLayout()
        t_layout.addWidget(self.threshold_slider)
        t_layout.addWidget(self.threshold_label)
        threshold_layout.addLayout(t_layout)
        self.threshold_slider.valueChanged.connect(lambda v: self.threshold_label.setText(str(v)))
        param_layout.addLayout(threshold_layout, 2)
        
        area_layout = QVBoxLayout()
        area_layout.addWidget(QLabel('最小划痕面积（像素）:'))
        self.area_slider = QSlider(Qt.Horizontal)
        self.area_slider.setRange(20, 200)
        self.area_slider.setValue(50)
        self.area_label = QLabel('50')
        self.area_label.setMinimumWidth(30)
        a_layout = QHBoxLayout()
        a_layout.addWidget(self.area_slider)
        a_layout.addWidget(self.area_label)
        area_layout.addLayout(a_layout)
        self.area_slider.valueChanged.connect(lambda v: self.area_label.setText(str(v)))
        param_layout.addLayout(area_layout, 2)
        
        control_layout.addLayout(param_layout)
        
        btn_layout = QHBoxLayout()
        self.compare_btn = QPushButton('开始对比分析')
        self.compare_btn.setFont(QFont('Microsoft YaHei', 10, QFont.Bold))
        self.compare_btn.clicked.connect(self._start_comparison)
        btn_layout.addWidget(self.compare_btn)
        
        self.recompare_btn = QPushButton('重新分析（调整参数后）')
        self.recompare_btn.setEnabled(False)
        self.recompare_btn.clicked.connect(self._recompare)
        btn_layout.addWidget(self.recompare_btn)
        
        self.save_btn = QPushButton('保存标记结果')
        self.save_btn.setEnabled(False)
        self.save_btn.clicked.connect(self._save_result)
        btn_layout.addWidget(self.save_btn)
        
        self.close_btn = QPushButton('关闭')
        self.close_btn.clicked.connect(self.reject)
        btn_layout.addWidget(self.close_btn)
        
        control_layout.addLayout(btn_layout)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        self.progress_label = QLabel('')
        self.progress_label.setVisible(False)
        control_layout.addWidget(self.progress_bar)
        control_layout.addWidget(self.progress_label)
        
        layout.addWidget(control_group)
        
        result_group = QGroupBox('对比结果')
        result_layout = QVBoxLayout(result_group)
        
        self.result_info = QLabel('请选择照片并点击"开始对比分析"')
        self.result_info.setStyleSheet('color: #666; padding: 10px;')
        result_layout.addWidget(self.result_info)
        
        splitter = QSplitter(Qt.Vertical)
        
        scroll1 = QScrollArea()
        scroll1.setWidgetResizable(True)
        self.image_label = QLabel('暂无结果')
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setMinimumHeight(400)
        self.image_label.setStyleSheet('background-color: #f0f0f0; border: 1px solid #ccc;')
        scroll1.setWidget(self.image_label)
        
        scroll2 = QScrollArea()
        scroll2.setWidgetResizable(True)
        self.detail_label = QLabel('')
        self.detail_label.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        self.detail_label.setWordWrap(True)
        self.detail_label.setStyleSheet('padding: 10px;')
        scroll2.setWidget(self.detail_label)
        
        splitter.addWidget(scroll1)
        splitter.addWidget(scroll2)
        splitter.setSizes([400, 200])
        
        result_layout.addWidget(splitter, 1)
        
        layout.addWidget(result_group, 1)
    
    def _load_history_photos(self):
        self.history_combo.clear()
        self.current_combo.clear()
        
        if not self.db or not self.sword_id:
            return
        
        records = self.db.get_maintenance_records(self.sword_id)
        
        for record in records:
            if record.get('after_photo_path') and os.path.exists(record['after_photo_path']):
                label = f"{record['maintenance_date']} - 保养后 ({os.path.basename(record['after_photo_path'])})"
                self.history_combo.addItem(label, record['after_photo_path'])
        
        for record in records:
            if record.get('before_photo_path') and os.path.exists(record['before_photo_path']):
                label = f"{record['maintenance_date']} - 保养前 ({os.path.basename(record['before_photo_path'])})"
                self.current_combo.addItem(label, record['before_photo_path'])
        
        if self.history_combo.count() == 0:
            self.history_combo.addItem('未找到历史保养后照片，请手动选择', None)
        
        if self.current_combo.count() == 0:
            self.current_combo.addItem('未找到历史保养前照片，请手动选择', None)
    
    def _browse_history(self):
        path, _ = QFileDialog.getOpenFileName(
            self, '选择历史照片', '',
            '图片文件 (*.jpg *.jpeg *.png *.bmp *.gif *.tiff)'
        )
        if path:
            self.history_combo.addItem(f"手动选择: {os.path.basename(path)}", path)
            self.history_combo.setCurrentIndex(self.history_combo.count() - 1)
    
    def _browse_current(self):
        path, _ = QFileDialog.getOpenFileName(
            self, '选择当前照片', '',
            '图片文件 (*.jpg *.jpeg *.png *.bmp *.gif *.tiff)'
        )
        if path:
            self.current_combo.addItem(f"手动选择: {os.path.basename(path)}", path)
            self.current_combo.setCurrentIndex(self.current_combo.count() - 1)
    
    def _get_selected_paths(self):
        base_path = self.history_combo.currentData()
        new_path = self.current_combo.currentData()
        return base_path, new_path
    
    def _start_comparison(self):
        base_path, new_path = self._get_selected_paths()
        
        if not base_path:
            QMessageBox.warning(self, '提示', '请选择历史照片')
            return
        
        if not new_path:
            QMessageBox.warning(self, '提示', '请选择当前照片')
            return
        
        threshold = self.threshold_slider.value()
        min_area = self.area_slider.value()
        
        self._run_comparison(base_path, new_path, threshold, min_area)
    
    def _recompare(self):
        if not self.results:
            return
        
        base_path, new_path = self._get_selected_paths()
        if not base_path or not new_path:
            return
        
        threshold = self.threshold_slider.value()
        min_area = self.area_slider.value()
        
        self._run_comparison(base_path, new_path, threshold, min_area)
    
    def _run_comparison(self, base_path, new_path, threshold, min_area):
        self.compare_btn.setEnabled(False)
        self.recompare_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        self.progress_bar.setVisible(True)
        self.progress_label.setVisible(True)
        self.progress_bar.setValue(0)
        
        self.worker = ComparisonWorker(
            self.comparator, base_path, new_path, threshold, min_area
        )
        self.worker.finished.connect(self._on_comparison_finished)
        self.worker.error.connect(self._on_comparison_error)
        self.worker.progress.connect(self._on_progress)
        self.worker.start()
    
    def _on_progress(self, value, message):
        self.progress_bar.setValue(value)
        self.progress_label.setText(message)
    
    def _on_comparison_finished(self, results):
        self.results = results
        self._display_results(results)
        
        self.compare_btn.setEnabled(True)
        self.recompare_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        self.progress_label.setVisible(False)
    
    def _on_comparison_error(self, error_msg):
        QMessageBox.critical(self, '错误', error_msg)
        self.compare_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        self.progress_label.setVisible(False)
    
    def _display_results(self, results):
        scratches = results['scratches']
        
        info_text = f"匹配状态: {results['match_quality']} | 检测到 {len(scratches)} 处异常区域"
        if len(scratches) > 5:
            info_text += " ⚠️ 划痕较多，建议关注"
        elif len(scratches) > 0:
            info_text += " 🔍 发现新增划痕"
        else:
            info_text += " ✅ 状态良好"
        
        self.result_info.setText(info_text)
        self.result_info.setStyleSheet(
            'color: darkgreen; padding: 10px; font-weight: bold;' 
            if len(scratches) == 0 else
            'color: darkorange; padding: 10px; font-weight: bold;'
        )
        
        marked = results['marked_image']
        self._show_image(marked)
        
        detail_text = self._generate_detail_text(results)
        self.detail_label.setText(detail_text)
    
    def _show_image(self, cv_image):
        if cv_image is None:
            return
        
        rgb = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb.shape
        bytes_per_line = ch * w
        qt_image = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)
        
        pixmap = QPixmap.fromImage(qt_image)
        
        label_size = self.image_label.size()
        if pixmap.width() > label_size.width() or pixmap.height() > label_size.height():
            pixmap = pixmap.scaled(label_size, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        
        self.image_label.setPixmap(pixmap)
    
    def _generate_detail_text(self, results):
        scratches = results['scratches']
        
        text = f"<h3>检测结果详情</h3>"
        text += f"<p><b>特征匹配点数量:</b> {results['num_matches']}</p>"
        text += f"<p><b>匹配质量:</b> {results['match_quality']}</p>"
        text += f"<p><b>发现异常区域:</b> {len(scratches)} 处</p>"
        
        if scratches:
            text += "<h4>划痕列表（按面积从大到小）:</h4>"
            text += "<ul>"
            for i, s in enumerate(scratches[:10], 1):
                text += f"<li>#{i}: 位置({s['x']},{s['y']}), 大小 {s['width']}×{s['height']}, 面积 {s['area']} 像素</li>"
            if len(scratches) > 10:
                text += f"<li>... 还有 {len(scratches) - 10} 处较小划痕</li>"
            text += "</ul>"
            
            total_area = sum(s['area'] for s in scratches)
            text += f"<p><b>总磨损面积:</b> {total_area} 像素</p>"
            
            if len(scratches) > 5:
                text += "<p style='color: darkorange;'><b>⚠️ 建议:</b> 划痕较多，建议检查是否有新的磨损源，或增加保养频率。</p>"
            elif len(scratches) > 0:
                text += "<p style='color: darkblue;'><b>💡 建议:</b> 存在少量新增划痕，记录入保养档案，下次保养重点关注。</p>"
        else:
            text += "<p style='color: darkgreen;'><b>✅ 状态良好:</b> 未检测到明显新增划痕，藏品保养状态良好。</p>"
        
        return text
    
    def _save_result(self):
        if not self.results or self.results['marked_image'] is None:
            return
        
        default_name = f"磨损对比_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        path, _ = QFileDialog.getSaveFileName(
            self, '保存标记结果', default_name,
            '图片文件 (*.jpg *.jpeg *.png)'
        )
        
        if not path:
            return
        
        success, err = self.comparator.save_marked_image(self.results['marked_image'], path)
        if success:
            QMessageBox.information(self, '成功', f'结果已保存至:\n{path}')
        else:
            QMessageBox.critical(self, '错误', err)


from datetime import datetime
