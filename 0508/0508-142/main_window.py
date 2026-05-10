import sys
from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QGridLayout,
    QLabel, QLineEdit, QComboBox, QPushButton, QTabWidget, QTextEdit,
    QGroupBox, QMessageBox, QFileDialog, QListWidget, QListWidgetItem,
    QSplitter, QSpinBox, QDoubleSpinBox, QFrame
)
from PyQt5.QtGui import QPixmap, QFont, QPalette, QColor, QPainter, QImage
from PyQt5.QtCore import Qt, QSize

from calculator import calculate_all
from patterns import PatternRenderer
from database import init_db, save_design, get_all_designs, get_design, delete_design
from pdf_export import export_design_pdf
from image_export import export_design_image

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('竹编工艺辅助工具')
        self.setMinimumSize(1200, 800)
        self.setStyleSheet(self._get_stylesheet())
        
        init_db()
        
        self.current_results = None
        self.pattern_renderer = PatternRenderer(width=600, height=450)
        
        self._setup_ui()
        self._connect_signals()
        
        self._calculate()
    
    def _get_stylesheet(self):
        return '''
        QMainWindow, QWidget {
            background-color: #FFF8F0;
        }
        QGroupBox {
            font-weight: bold;
            font-size: 12pt;
            border: 2px solid #8B7355;
            border-radius: 8px;
            margin-top: 12px;
            padding-top: 10px;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 15px;
            padding: 0 8px 0 8px;
            color: #5D4037;
        }
        QLabel {
            font-size: 10pt;
            color: #3E2723;
        }
        QLineEdit, QDoubleSpinBox, QSpinBox {
            font-size: 11pt;
            padding: 6px 10px;
            border: 1px solid #BCAAA4;
            border-radius: 4px;
            background-color: #FFFFFF;
            min-height: 20px;
        }
        QLineEdit:focus, QDoubleSpinBox:focus, QSpinBox:focus {
            border: 2px solid #8B5A2B;
        }
        QComboBox {
            font-size: 11pt;
            padding: 6px 10px;
            border: 1px solid #BCAAA4;
            border-radius: 4px;
            background-color: #FFFFFF;
            min-height: 20px;
        }
        QComboBox::drop-down {
            border: none;
        }
        QPushButton {
            font-size: 10pt;
            font-weight: bold;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            background-color: #8B5A2B;
            color: #FFFFFF;
            min-width: 80px;
        }
        QPushButton:hover {
            background-color: #A0522D;
        }
        QPushButton:pressed {
            background-color: #6B4226;
        }
        QPushButton:disabled {
            background-color: #BCAAA4;
        }
        QTabWidget::pane {
            border: 2px solid #8B7355;
            border-radius: 6px;
            background-color: #FFFFFF;
        }
        QTabBar::tab {
            font-size: 10pt;
            font-weight: bold;
            padding: 10px 20px;
            margin-right: 2px;
            background-color: #D7CCC8;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }
        QTabBar::tab:selected {
            background-color: #8B5A2B;
            color: #FFFFFF;
        }
        QListWidget {
            border: 1px solid #BCAAA4;
            border-radius: 4px;
            background-color: #FFFFFF;
            font-size: 10pt;
        }
        QListWidget::item {
            padding: 8px;
            border-bottom: 1px solid #EFEBE9;
        }
        QListWidget::item:selected {
            background-color: #D7CCC8;
            color: #3E2723;
        }
        QTextEdit {
            border: 1px solid #BCAAA4;
            border-radius: 4px;
            background-color: #FFFFFF;
            font-family: Consolas, monospace;
            font-size: 10pt;
        }
        '''
    
    def _setup_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(15)
        
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(0, 0, 0, 0)
        left_layout.setSpacing(15)
        left_panel.setFixedWidth(380)
        
        params_group = QGroupBox('篮筐参数')
        params_layout = QGridLayout(params_group)
        params_layout.setSpacing(12)
        params_layout.setContentsMargins(15, 20, 15, 15)
        
        params_layout.addWidget(QLabel('方案名称:'), 0, 0)
        self.design_name_edit = QLineEdit('我的竹篮设计')
        params_layout.addWidget(self.design_name_edit, 0, 1)
        
        params_layout.addWidget(QLabel('开口直径 (mm):'), 1, 0)
        self.opening_diameter_edit = QDoubleSpinBox()
        self.opening_diameter_edit.setRange(50, 1000)
        self.opening_diameter_edit.setValue(300)
        self.opening_diameter_edit.setSuffix(' mm')
        params_layout.addWidget(self.opening_diameter_edit, 1, 1)
        
        params_layout.addWidget(QLabel('底部直径 (mm):'), 2, 0)
        self.bottom_diameter_edit = QDoubleSpinBox()
        self.bottom_diameter_edit.setRange(50, 1000)
        self.bottom_diameter_edit.setValue(200)
        self.bottom_diameter_edit.setSuffix(' mm')
        params_layout.addWidget(self.bottom_diameter_edit, 2, 1)
        
        params_layout.addWidget(QLabel('篮筐高度 (mm):'), 3, 0)
        self.height_edit = QDoubleSpinBox()
        self.height_edit.setRange(20, 500)
        self.height_edit.setValue(250)
        self.height_edit.setSuffix(' mm')
        params_layout.addWidget(self.height_edit, 3, 1)
        
        params_layout.addWidget(QLabel('竹篾宽度 (mm):'), 4, 0)
        self.strip_width_edit = QDoubleSpinBox()
        self.strip_width_edit.setRange(0.5, 20)
        self.strip_width_edit.setValue(5)
        self.strip_width_edit.setSuffix(' mm')
        self.strip_width_edit.setSingleStep(0.5)
        params_layout.addWidget(self.strip_width_edit, 4, 1)
        
        params_layout.addWidget(QLabel('竹篾厚度 (mm):'), 5, 0)
        self.strip_thickness_edit = QDoubleSpinBox()
        self.strip_thickness_edit.setRange(0.1, 10)
        self.strip_thickness_edit.setValue(0.75)
        self.strip_thickness_edit.setSuffix(' mm')
        self.strip_thickness_edit.setSingleStep(0.1)
        params_layout.addWidget(self.strip_thickness_edit, 5, 1)
        
        params_layout.addWidget(QLabel('编织纹样:'), 6, 0)
        self.pattern_combo = QComboBox()
        self.pattern_combo.addItems(['人字纹 (Herringbone)', '六角眼 (Hexagon Eye)'])
        params_layout.addWidget(self.pattern_combo, 6, 1)
        
        left_layout.addWidget(params_group)
        
        btn_layout = QHBoxLayout()
        self.calc_btn = QPushButton('计算并预览')
        self.save_btn = QPushButton('保存方案')
        self.pdf_btn = QPushButton('导出PDF')
        self.img_btn = QPushButton('导出图片')
        btn_layout.addWidget(self.calc_btn)
        btn_layout.addWidget(self.save_btn)
        btn_layout.addWidget(self.pdf_btn)
        btn_layout.addWidget(self.img_btn)
        left_layout.addLayout(btn_layout)
        
        results_group = QGroupBox('计算结果')
        results_layout = QGridLayout(results_group)
        results_layout.setSpacing(10)
        results_layout.setContentsMargins(15, 20, 15, 15)
        
        self.warp_count_label = QLabel('-')
        self.weft_per_layer_label = QLabel('-')
        self.weft_layers_label = QLabel('-')
        self.strip_length_label = QLabel('-')
        self.warp_gap_label = QLabel('-')
        
        for label in [self.warp_count_label, self.weft_per_layer_label, 
                      self.weft_layers_label, self.strip_length_label]:
            label.setStyleSheet('font-size: 14pt; font-weight: bold; color: #8B5A2B;')
        
        self.warp_gap_label.setStyleSheet('font-size: 10pt; font-weight: bold; color: #2E7D32;')
        
        results_layout.addWidget(QLabel('经线根数:'), 0, 0)
        results_layout.addWidget(self.warp_count_label, 0, 1)
        results_layout.addWidget(QLabel('纬线每层根数:'), 1, 0)
        results_layout.addWidget(self.weft_per_layer_label, 1, 1)
        results_layout.addWidget(QLabel('纬线总层数:'), 2, 0)
        results_layout.addWidget(self.weft_layers_label, 2, 1)
        results_layout.addWidget(QLabel('竹篾估算用量:'), 3, 0)
        results_layout.addWidget(self.strip_length_label, 3, 1)
        results_layout.addWidget(QLabel('间隙精度:'), 4, 0)
        results_layout.addWidget(self.warp_gap_label, 4, 1)
        
        left_layout.addWidget(results_group)
        
        saved_group = QGroupBox('已保存方案')
        saved_layout = QVBoxLayout(saved_group)
        saved_layout.setContentsMargins(15, 20, 15, 15)
        
        self.designs_list = QListWidget()
        self.designs_list.itemDoubleClicked.connect(self._load_selected_design)
        saved_layout.addWidget(self.designs_list)
        
        saved_btn_layout = QHBoxLayout()
        self.load_btn = QPushButton('加载')
        self.delete_btn = QPushButton('删除')
        self.refresh_btn = QPushButton('刷新')
        saved_btn_layout.addWidget(self.load_btn)
        saved_btn_layout.addWidget(self.delete_btn)
        saved_btn_layout.addWidget(self.refresh_btn)
        saved_layout.addLayout(saved_btn_layout)
        
        left_layout.addWidget(saved_group)
        
        main_layout.addWidget(left_panel)
        
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(0, 0, 0, 0)
        right_layout.setSpacing(10)
        
        self.preview_tabs = QTabWidget()
        
        self.grid_label = QLabel()
        self.grid_label.setAlignment(Qt.AlignCenter)
        self.grid_label.setMinimumHeight(400)
        self.grid_label.setStyleSheet('background-color: #FFFFFF; border: 2px solid #8B7355; border-radius: 8px;')
        self.preview_tabs.addTab(self.grid_label, '编织展开图')
        
        self.pattern_label = QLabel()
        self.pattern_label.setAlignment(Qt.AlignCenter)
        self.pattern_label.setMinimumHeight(400)
        self.pattern_label.setStyleSheet('background-color: #FFFFFF; border: 2px solid #8B7355; border-radius: 8px;')
        self.preview_tabs.addTab(self.pattern_label, '纹样预览')
        
        self.info_text = QTextEdit()
        self.info_text.setReadOnly(True)
        self.info_text.setMinimumHeight(150)
        self.info_text.setStyleSheet('border: 2px solid #8B7355; border-radius: 8px; padding: 10px;')
        
        right_layout.addWidget(self.preview_tabs)
        right_layout.addWidget(self.info_text)
        
        main_layout.addWidget(right_panel, 1)
        
        self._refresh_designs_list()
    
    def _connect_signals(self):
        self.calc_btn.clicked.connect(self._calculate)
        self.save_btn.clicked.connect(self._save_design)
        self.pdf_btn.clicked.connect(self._export_pdf)
        self.img_btn.clicked.connect(self._export_image)
        self.load_btn.clicked.connect(self._load_selected_design)
        self.delete_btn.clicked.connect(self._delete_selected_design)
        self.refresh_btn.clicked.connect(self._refresh_designs_list)
        
        self.opening_diameter_edit.valueChanged.connect(self._auto_calculate)
        self.bottom_diameter_edit.valueChanged.connect(self._auto_calculate)
        self.height_edit.valueChanged.connect(self._auto_calculate)
        self.strip_width_edit.valueChanged.connect(self._auto_calculate)
        self.strip_thickness_edit.valueChanged.connect(self._auto_calculate)
        self.pattern_combo.currentIndexChanged.connect(self._auto_calculate)
    
    def _auto_calculate(self):
        self._calculate()
    
    def _calculate(self):
        try:
            opening_diameter = float(self.opening_diameter_edit.value())
            bottom_diameter = float(self.bottom_diameter_edit.value())
            height = float(self.height_edit.value())
            strip_width = float(self.strip_width_edit.value())
            strip_thickness = float(self.strip_thickness_edit.value())
            pattern_idx = self.pattern_combo.currentIndex()
            pattern_type = 'herringbone' if pattern_idx == 0 else 'hexagon'
            
            if opening_diameter <= 0 or bottom_diameter <= 0 or height <= 0 or strip_width <= 0 or strip_thickness <= 0:
                raise ValueError('所有参数必须大于0')
            
            results = calculate_all(opening_diameter, bottom_diameter, height, strip_width, pattern_type, strip_thickness)
            self.current_results = results
            
            self.warp_count_label.setText(f'{results["warp_count"]} 根')
            self.weft_per_layer_label.setText(f'{results["weft_per_layer"]} 根')
            self.weft_layers_label.setText(f'{results["weft_layers"]} 层')
            self.strip_length_label.setText(f'{results["strip_length_estimate"]} 米')
            
            gap_inner = results.get('warp_gap_inner', 0)
            gap_outer = results.get('warp_gap_outer', 0)
            if gap_inner >= 0:
                self.warp_gap_label.setText(f'内{gap_inner}mm / 外{gap_outer}mm ✓')
                self.warp_gap_label.setStyleSheet('font-size: 10pt; font-weight: bold; color: #2E7D32;')
            else:
                self.warp_gap_label.setText(f'重叠{-gap_inner}mm ⚠')
                self.warp_gap_label.setStyleSheet('font-size: 10pt; font-weight: bold; color: #C62828;')
            
            self._update_previews(results["warp_count"], results["weft_layers"], 
                                  results["weft_per_layer"], pattern_type)
            self._update_info(opening_diameter, bottom_diameter, height, strip_width, strip_thickness, results, pattern_type)
            
        except ValueError as e:
            QMessageBox.warning(self, '参数错误', f'请输入有效的参数值: {str(e)}')
        except Exception as e:
            QMessageBox.critical(self, '计算错误', f'计算过程中出错: {str(e)}')
    
    def _update_previews(self, warp_count, weft_layers, weft_per_layer, pattern_type):
        grid_image = self.pattern_renderer.render_grid(warp_count, weft_layers, weft_per_layer)
        self._display_image(self.grid_label, grid_image)
        
        if pattern_type == 'herringbone':
            pattern_image = self.pattern_renderer.render_herringbone(warp_count, weft_layers)
        else:
            pattern_image = self.pattern_renderer.render_hexagon(warp_count, weft_layers)
        self._display_image(self.pattern_label, pattern_image)
    
    def _display_image(self, label, image):
        pixmap = QPixmap.fromImage(image)
        scaled_pixmap = pixmap.scaled(label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation)
        label.setPixmap(scaled_pixmap)
    
    def _update_info(self, opening_diameter, bottom_diameter, height, strip_width, strip_thickness, results, pattern_type):
        pattern_name = '人字纹' if pattern_type == 'herringbone' else '六角眼'
        gap_inner = results.get('warp_gap_inner', 0)
        gap_outer = results.get('warp_gap_outer', 0)
        
        if gap_inner >= 0:
            gap_status = '间隙均匀分布'
        else:
            gap_status = '存在重叠，建议减少根数或增加直径'
        
        info = f'''
{'='*60}
                    竹编工艺设计信息
{'='*60}

【基本参数】
  方案名称:  {self.design_name_edit.text()}
  开口直径:  {opening_diameter} mm
  底部直径:  {bottom_diameter} mm
  篮筐高度:  {height} mm
  竹篾宽度:  {strip_width} mm
  竹篾厚度:  {strip_thickness} mm
  编织纹样:  {pattern_name}

【计算结果】
  经线根数:  {results['warp_count']} 根
     - 使用精确几何模型计算（考虑竹篾厚度）
     - 选择最接近理论值的整数根数
     - 自动评估是否需要调整为偶数

  经线间隙:  内侧 {gap_inner} mm | 外侧 {gap_outer} mm
     - 间隙计算考虑了竹篾厚度的径向累积效应
     - {gap_status}

  纬线每层根数: {results['weft_per_layer']} 根
     - 同样考虑竹篾厚度的精确计算

  纬线总层数: {results['weft_layers']} 层
     - 根据篮筐高度和纹样密度计算

  竹篾估算用量: {results['strip_length_estimate']} 米
     - 含10%-15%的搭接余量

【精度说明】
  改进前: 简单周长/宽度，忽略竹篾厚度，容易导致最后一条缝隙过大或过小
  改进后: 
     1. 计算竹篾在圆周上实际占据的圆心角
     2. 选择根数使剩余角度能均匀分配
     3. 显示内外侧实际间隙值，便于验证

【编织说明】
  1. 经线: 从底部圆周均匀分布，贯穿整个高度
  2. 纬线: 从底部开始，逐层向上编织
  3. 建议: 竹篾长度预留15%的余量用于收口固定
  4. 注意: 如显示重叠，建议调整参数避免竹篾挤压

{'='*60}
'''
        self.info_text.setText(info)
    
    def _save_design(self):
        if not self.current_results:
            QMessageBox.warning(self, '提示', '请先计算设计方案')
            return
        
        design_data = {
            'name': self.design_name_edit.text() or '未命名方案',
            'opening_diameter': float(self.opening_diameter_edit.value()),
            'bottom_diameter': float(self.bottom_diameter_edit.value()),
            'height': float(self.height_edit.value()),
            'strip_width': float(self.strip_width_edit.value()),
            'strip_thickness': float(self.strip_thickness_edit.value()),
            'pattern_type': 'herringbone' if self.pattern_combo.currentIndex() == 0 else 'hexagon',
            'warp_count': self.current_results['warp_count'],
            'weft_per_layer': self.current_results['weft_per_layer'],
            'weft_layers': self.current_results['weft_layers'],
            'strip_length_estimate': self.current_results['strip_length_estimate']
        }
        
        try:
            design_id = save_design(design_data)
            QMessageBox.information(self, '成功', f'方案已保存! (ID: {design_id})')
            self._refresh_designs_list()
        except Exception as e:
            QMessageBox.critical(self, '错误', f'保存失败: {str(e)}')
    
    def _refresh_designs_list(self):
        self.designs_list.clear()
        try:
            designs = get_all_designs()
            for d in designs:
                pattern_name = '人字纹' if d['pattern_type'] == 'herringbone' else '六角眼'
                item_text = f"{d['name']} | {d['opening_diameter']}mm/{d['height']}mm | {pattern_name} | {d['created_at']}"
                item = QListWidgetItem(item_text)
                item.setData(Qt.UserRole, d['id'])
                self.designs_list.addItem(item)
        except Exception as e:
            QMessageBox.critical(self, '错误', f'加载方案列表失败: {str(e)}')
    
    def _load_selected_design(self):
        current_item = self.designs_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, '提示', '请先选择一个方案')
            return
        
        design_id = current_item.data(Qt.UserRole)
        design = get_design(design_id)
        if design:
            self.design_name_edit.setText(design['name'])
            self.opening_diameter_edit.setValue(design['opening_diameter'])
            self.bottom_diameter_edit.setValue(design['bottom_diameter'])
            self.height_edit.setValue(design['height'])
            self.strip_width_edit.setValue(design['strip_width'])
            
            strip_thickness = design.get('strip_thickness', design['strip_width'] * 0.15)
            self.strip_thickness_edit.setValue(strip_thickness)
            
            self.pattern_combo.setCurrentIndex(0 if design['pattern_type'] == 'herringbone' else 1)
            
            self._calculate()
        else:
            QMessageBox.warning(self, '错误', '无法加载方案')
    
    def _delete_selected_design(self):
        current_item = self.designs_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, '提示', '请先选择一个方案')
            return
        
        reply = QMessageBox.question(self, '确认删除', '确定要删除此方案吗?',
                                     QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply == QMessageBox.Yes:
            design_id = current_item.data(Qt.UserRole)
            try:
                delete_design(design_id)
                self._refresh_designs_list()
                QMessageBox.information(self, '成功', '方案已删除')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'删除失败: {str(e)}')
    
    def _export_pdf(self):
        if not self.current_results:
            QMessageBox.warning(self, '提示', '请先计算设计方案')
            return
        
        filepath, _ = QFileDialog.getSaveFileName(
            self, '导出PDF图纸',
            f'{self.design_name_edit.text() or "竹编设计"}.pdf',
            'PDF Files (*.pdf)'
        )
        
        if filepath:
            design_data = {
                'name': self.design_name_edit.text() or '未命名方案',
                'opening_diameter': float(self.opening_diameter_edit.value()),
                'bottom_diameter': float(self.bottom_diameter_edit.value()),
                'height': float(self.height_edit.value()),
                'strip_width': float(self.strip_width_edit.value()),
                'strip_thickness': float(self.strip_thickness_edit.value()),
                'pattern_type': 'herringbone' if self.pattern_combo.currentIndex() == 0 else 'hexagon',
                'warp_count': self.current_results['warp_count'],
                'weft_per_layer': self.current_results['weft_per_layer'],
                'weft_layers': self.current_results['weft_layers'],
                'strip_length_estimate': self.current_results['strip_length_estimate'],
                'warp_gap_inner': self.current_results.get('warp_gap_inner', 0),
                'warp_gap_outer': self.current_results.get('warp_gap_outer', 0)
            }
            
            try:
                export_design_pdf(filepath, design_data)
                QMessageBox.information(self, '成功', f'PDF图纸已导出到:\n{filepath}')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'导出失败: {str(e)}')
    
    def _export_image(self):
        if not self.current_results:
            QMessageBox.warning(self, '提示', '请先计算设计方案')
            return
        
        filepath, _ = QFileDialog.getSaveFileName(
            self, '导出图片',
            f'{self.design_name_edit.text() or "竹编设计"}.png',
            'PNG图片 (*.png);;JPG图片 (*.jpg *.jpeg)'
        )
        
        if filepath:
            design_data = {
                'name': self.design_name_edit.text() or '未命名方案',
                'opening_diameter': float(self.opening_diameter_edit.value()),
                'bottom_diameter': float(self.bottom_diameter_edit.value()),
                'height': float(self.height_edit.value()),
                'strip_width': float(self.strip_width_edit.value()),
                'strip_thickness': float(self.strip_thickness_edit.value()),
                'pattern_type': 'herringbone' if self.pattern_combo.currentIndex() == 0 else 'hexagon',
                'warp_count': self.current_results['warp_count'],
                'weft_per_layer': self.current_results['weft_per_layer'],
                'weft_layers': self.current_results['weft_layers'],
                'strip_length_estimate': self.current_results['strip_length_estimate'],
                'warp_gap_inner': self.current_results.get('warp_gap_inner', 0),
                'warp_gap_outer': self.current_results.get('warp_gap_outer', 0)
            }
            
            ext = filepath.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg']:
                img_format = 'JPEG'
            else:
                img_format = 'PNG'
            
            try:
                export_design_image(filepath, design_data, format=img_format)
                QMessageBox.information(self, '成功', f'图片已导出到:\n{filepath}')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'导出失败: {str(e)}')
