import sys
import os
from datetime import datetime

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QTableWidget, QTableWidgetItem,
    QDialog, QFormLayout, QMessageBox, QComboBox, QCheckBox, QSpinBox,
    QDoubleSpinBox, QTextEdit, QFileDialog, QDateEdit, QHeaderView,
    QSplitter, QGroupBox, QFrame, QTabWidget
)
from PyQt5.QtCore import Qt, QDate
from PyQt5.QtGui import QColor, QFont

from database import Database
from risk_analyzer import RiskAnalyzer
from pdf_report import PDFReportGenerator

try:
    from wear_compare_dialog import WearCompareDialog
    WEAR_COMPARE_AVAILABLE = True
except ImportError:
    WEAR_COMPARE_AVAILABLE = False

MATERIALS = ['碳钢', '高碳钢', '不锈钢', '大马士革钢', '花纹钢', '玉钢', '其他']
OIL_TYPES = ['刀油（矿物油）', '茶油', '橄榄油', '防锈油', '硅油', '其他']
CLEANING_METHODS = ['擦拭（棉布）', '打磨（细砂纸）', '化学除锈', '超声波清洗', '其他']

RISK_COLORS = {
    '高': QColor(220, 50, 50),
    '中': QColor(240, 160, 50),
    '低': QColor(50, 180, 80)
}

class SwordDialog(QDialog):
    def __init__(self, parent=None, sword=None):
        super().__init__(parent)
        self.setWindowTitle('藏品信息')
        self.setMinimumWidth(400)
        self.sword = sword
        self._init_ui()
    
    def _init_ui(self):
        layout = QFormLayout(self)
        
        self.name_edit = QLineEdit()
        layout.addRow('藏品名称：', self.name_edit)
        
        self.material_combo = QComboBox()
        self.material_combo.addItems(MATERIALS)
        layout.addRow('材质：', self.material_combo)
        
        self.blade_length_spin = QDoubleSpinBox()
        self.blade_length_spin.setRange(0, 500)
        self.blade_length_spin.setSuffix(' cm')
        self.blade_length_spin.setDecimals(1)
        layout.addRow('刃长：', self.blade_length_spin)
        
        self.production_year_spin = QSpinBox()
        self.production_year_spin.setRange(0, 2026)
        self.production_year_spin.setValue(datetime.now().year)
        self.production_year_spin.setSpecialValueText('未记录')
        layout.addRow('制作年代：', self.production_year_spin)
        
        self.status_edit = QLineEdit()
        self.status_edit.setPlaceholderText('例如：良好、轻微锈蚀、需要保养等')
        layout.addRow('当前状态：', self.status_edit)
        
        btn_layout = QHBoxLayout()
        self.save_btn = QPushButton('保存')
        self.save_btn.clicked.connect(self.accept)
        self.cancel_btn = QPushButton('取消')
        self.cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(self.save_btn)
        btn_layout.addWidget(self.cancel_btn)
        layout.addRow(btn_layout)
        
        if self.sword:
            self._load_sword_data()
    
    def _load_sword_data(self):
        self.name_edit.setText(self.sword.get('name', ''))
        
        material = self.sword.get('material', '其他')
        idx = self.material_combo.findText(material)
        if idx >= 0:
            self.material_combo.setCurrentIndex(idx)
        
        blade_length = self.sword.get('blade_length')
        if blade_length:
            self.blade_length_spin.setValue(float(blade_length))
        
        production_year = self.sword.get('production_year')
        if production_year:
            self.production_year_spin.setValue(int(production_year))
        
        self.status_edit.setText(self.sword.get('current_status', ''))
    
    def get_data(self):
        blade_length = self.blade_length_spin.value()
        if blade_length <= 0:
            blade_length = None
        
        production_year = self.production_year_spin.value()
        if production_year <= 0:
            production_year = None
        
        return {
            'name': self.name_edit.text().strip(),
            'material': self.material_combo.currentText(),
            'blade_length': blade_length,
            'production_year': production_year,
            'current_status': self.status_edit.text().strip()
        }
    
    def accept(self):
        data = self.get_data()
        if not data['name']:
            QMessageBox.warning(self, '提示', '请输入藏品名称')
            return
        super().accept()

class MaintenanceDialog(QDialog):
    def __init__(self, parent=None, sword_id=None, record=None):
        super().__init__(parent)
        self.setWindowTitle('保养记录')
        self.setMinimumWidth(450)
        self.sword_id = sword_id
        self.record = record
        self.before_photo_path = ''
        self.after_photo_path = ''
        self._init_ui()
    
    def _init_ui(self):
        layout = QFormLayout(self)
        
        self.date_edit = QDateEdit()
        self.date_edit.setCalendarPopup(True)
        self.date_edit.setDate(QDate.currentDate())
        layout.addRow('保养日期：', self.date_edit)
        
        self.oil_combo = QComboBox()
        self.oil_combo.setEditable(True)
        self.oil_combo.addItems(OIL_TYPES)
        layout.addRow('使用油品：', self.oil_combo)
        
        self.cleaning_combo = QComboBox()
        self.cleaning_combo.setEditable(True)
        self.cleaning_combo.addItems(CLEANING_METHODS)
        layout.addRow('清洁方式：', self.cleaning_combo)
        
        self.rust_removed_check = QCheckBox('本次进行了除锈操作')
        layout.addRow('除锈：', self.rust_removed_check)
        
        self.humidity_spin = QDoubleSpinBox()
        self.humidity_spin.setRange(0, 100)
        self.humidity_spin.setSuffix(' %')
        self.humidity_spin.setValue(50)
        self.humidity_spin.setSpecialValueText('未记录')
        layout.addRow('环境湿度：', self.humidity_spin)
        
        self.notes_edit = QTextEdit()
        self.notes_edit.setPlaceholderText('保养备注，例如：发现轻微锈迹、刃部光泽度恢复等')
        self.notes_edit.setMaximumHeight(80)
        layout.addRow('备注：', self.notes_edit)
        
        photo_group = QGroupBox('保养照片（可选）')
        photo_layout = QVBoxLayout(photo_group)
        
        before_layout = QHBoxLayout()
        self.before_photo_label = QLabel('未选择')
        self.before_photo_label.setStyleSheet('color: gray;')
        self.before_photo_btn = QPushButton('选择保养前照片')
        self.before_photo_btn.clicked.connect(self._select_before_photo)
        before_layout.addWidget(self.before_photo_btn)
        before_layout.addWidget(self.before_photo_label, 1)
        photo_layout.addLayout(before_layout)
        
        after_layout = QHBoxLayout()
        self.after_photo_label = QLabel('未选择')
        self.after_photo_label.setStyleSheet('color: gray;')
        self.after_photo_btn = QPushButton('选择保养后照片')
        self.after_photo_btn.clicked.connect(self._select_after_photo)
        after_layout.addWidget(self.after_photo_btn)
        after_layout.addWidget(self.after_photo_label, 1)
        photo_layout.addLayout(after_layout)
        
        layout.addRow(photo_group)
        
        btn_layout = QHBoxLayout()
        self.save_btn = QPushButton('保存')
        self.save_btn.clicked.connect(self.accept)
        self.cancel_btn = QPushButton('取消')
        self.cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(self.save_btn)
        btn_layout.addWidget(self.cancel_btn)
        layout.addRow(btn_layout)
        
        if self.record:
            self._load_record_data()
    
    def _select_before_photo(self):
        path, _ = QFileDialog.getOpenFileName(
            self, '选择保养前照片', '',
            '图片文件 (*.jpg *.jpeg *.png *.bmp *.gif)'
        )
        if path:
            self.before_photo_path = path
            self.before_photo_label.setText(os.path.basename(path))
            self.before_photo_label.setStyleSheet('color: black;')
    
    def _select_after_photo(self):
        path, _ = QFileDialog.getOpenFileName(
            self, '选择保养后照片', '',
            '图片文件 (*.jpg *.jpeg *.png *.bmp *.gif)'
        )
        if path:
            self.after_photo_path = path
            self.after_photo_label.setText(os.path.basename(path))
            self.after_photo_label.setStyleSheet('color: black;')
    
    def _load_record_data(self):
        try:
            date_str = self.record.get('maintenance_date', '')
            if date_str:
                qdate = QDate.fromString(date_str, 'yyyy-MM-dd')
                if qdate.isValid():
                    self.date_edit.setDate(qdate)
        except Exception:
            pass
        
        oil = self.record.get('oil_used', '')
        if oil:
            idx = self.oil_combo.findText(oil)
            if idx >= 0:
                self.oil_combo.setCurrentIndex(idx)
            else:
                self.oil_combo.setCurrentText(oil)
        
        cleaning = self.record.get('cleaning_method', '')
        if cleaning:
            idx = self.cleaning_combo.findText(cleaning)
            if idx >= 0:
                self.cleaning_combo.setCurrentIndex(idx)
            else:
                self.cleaning_combo.setCurrentText(cleaning)
        
        self.rust_removed_check.setChecked(bool(self.record.get('rust_removed', 0)))
        
        humidity = self.record.get('humidity')
        if humidity:
            self.humidity_spin.setValue(float(humidity))
        
        self.notes_edit.setPlainText(self.record.get('notes', ''))
        
        self.before_photo_path = self.record.get('before_photo_path', '')
        if self.before_photo_path:
            self.before_photo_label.setText(os.path.basename(self.before_photo_path))
            self.before_photo_label.setStyleSheet('color: black;')
        
        self.after_photo_path = self.record.get('after_photo_path', '')
        if self.after_photo_path:
            self.after_photo_label.setText(os.path.basename(self.after_photo_path))
            self.after_photo_label.setStyleSheet('color: black;')
    
    def get_data(self):
        humidity = self.humidity_spin.value()
        if humidity <= 0:
            humidity = None
        
        return {
            'sword_id': self.sword_id,
            'maintenance_date': self.date_edit.date().toString('yyyy-MM-dd'),
            'oil_used': self.oil_combo.currentText().strip(),
            'cleaning_method': self.cleaning_combo.currentText().strip(),
            'rust_removed': self.rust_removed_check.isChecked(),
            'humidity': humidity,
            'notes': self.notes_edit.toPlainText().strip(),
            'before_photo_path': self.before_photo_path,
            'after_photo_path': self.after_photo_path
        }
    
    def accept(self):
        data = self.get_data()
        if not data['maintenance_date']:
            QMessageBox.warning(self, '提示', '请选择保养日期')
            return
        super().accept()

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.db = Database()
        self.risk_analyzer = RiskAnalyzer(self.db)
        self.pdf_generator = PDFReportGenerator()
        self.current_sword_id = None
        
        self._init_ui()
        self._refresh_sword_list()
    
    def _init_ui(self):
        self.setWindowTitle('刀剑守护者 - 收藏级刀剑保养记录系统')
        self.setMinimumSize(1000, 700)
        
        central = QWidget()
        self.setCentralWidget(central)
        
        main_layout = QVBoxLayout(central)
        
        header = QLabel('刀剑守护者 - 收藏级刀剑保养记录系统')
        header.setFont(QFont('Microsoft YaHei', 16, QFont.Bold))
        header.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(header)
        
        splitter = QSplitter(Qt.Horizontal)
        
        left_panel = self._create_left_panel()
        right_panel = self._create_right_panel()
        
        splitter.addWidget(left_panel)
        splitter.addWidget(right_panel)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 2)
        
        main_layout.addWidget(splitter, 1)
    
    def _create_left_panel(self):
        panel = QFrame()
        panel.setFrameShape(QFrame.StyledPanel)
        layout = QVBoxLayout(panel)
        
        header = QLabel('藏品列表')
        header.setFont(QFont('Microsoft YaHei', 11, QFont.Bold))
        layout.addWidget(header)
        
        btn_layout = QHBoxLayout()
        self.add_sword_btn = QPushButton('添加藏品')
        self.add_sword_btn.clicked.connect(self._add_sword)
        btn_layout.addWidget(self.add_sword_btn)
        
        self.edit_sword_btn = QPushButton('编辑')
        self.edit_sword_btn.clicked.connect(self._edit_sword)
        btn_layout.addWidget(self.edit_sword_btn)
        
        self.delete_sword_btn = QPushButton('删除')
        self.delete_sword_btn.clicked.connect(self._delete_sword)
        btn_layout.addWidget(self.delete_sword_btn)
        
        layout.addLayout(btn_layout)
        
        self.sword_table = QTableWidget()
        self.sword_table.setColumnCount(3)
        self.sword_table.setHorizontalHeaderLabels(['名称', '材质', '风险'])
        self.sword_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.sword_table.verticalHeader().setVisible(False)
        self.sword_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.sword_table.setSelectionMode(QTableWidget.SingleSelection)
        self.sword_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.sword_table.itemSelectionChanged.connect(self._on_sword_selected)
        layout.addWidget(self.sword_table, 1)
        
        return panel
    
    def _create_right_panel(self):
        panel = QFrame()
        panel.setFrameShape(QFrame.StyledPanel)
        layout = QVBoxLayout(panel)
        
        self.tabs = QTabWidget()
        self.tabs.addTab(self._create_detail_tab(), '详细信息')
        self.tabs.addTab(self._create_maintenance_tab(), '保养记录')
        self.tabs.addTab(self._create_risk_tab(), '风险评估')
        layout.addWidget(self.tabs)
        
        return panel
    
    def _create_detail_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        self.detail_group = QGroupBox('藏品基本信息')
        detail_layout = QFormLayout(self.detail_group)
        
        self.detail_name = QLabel('-')
        self.detail_material = QLabel('-')
        self.detail_length = QLabel('-')
        self.detail_year = QLabel('-')
        self.detail_status = QLabel('-')
        
        detail_layout.addRow('藏品名称：', self.detail_name)
        detail_layout.addRow('材质：', self.detail_material)
        detail_layout.addRow('刃长：', self.detail_length)
        detail_layout.addRow('制作年代：', self.detail_year)
        detail_layout.addRow('当前状态：', self.detail_status)
        
        layout.addWidget(self.detail_group)
        
        layout.addStretch(1)
        
        return widget
    
    def _create_maintenance_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        btn_layout = QHBoxLayout()
        self.add_record_btn = QPushButton('添加保养记录')
        self.add_record_btn.clicked.connect(self._add_maintenance_record)
        btn_layout.addWidget(self.add_record_btn)
        
        self.edit_record_btn = QPushButton('编辑记录')
        self.edit_record_btn.clicked.connect(self._edit_maintenance_record)
        btn_layout.addWidget(self.edit_record_btn)
        
        self.delete_record_btn = QPushButton('删除记录')
        self.delete_record_btn.clicked.connect(self._delete_maintenance_record)
        btn_layout.addWidget(self.delete_record_btn)
        
        self.export_pdf_btn = QPushButton('导出PDF报告')
        self.export_pdf_btn.clicked.connect(self._export_pdf_report)
        btn_layout.addWidget(self.export_pdf_btn)
        
        self.wear_compare_btn = QPushButton('🔍 磨损对比')
        self.wear_compare_btn.clicked.connect(self._open_wear_compare)
        if not WEAR_COMPARE_AVAILABLE:
            self.wear_compare_btn.setEnabled(False)
            self.wear_compare_btn.setToolTip('需要安装 opencv-python 和 opencv-contrib-python')
        btn_layout.addWidget(self.wear_compare_btn)
        
        layout.addLayout(btn_layout)
        
        self.record_table = QTableWidget()
        self.record_table.setColumnCount(6)
        self.record_table.setHorizontalHeaderLabels([
            '保养日期', '使用油品', '清洁方式', '除锈', '湿度(%)', '备注'
        ])
        self.record_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.record_table.verticalHeader().setVisible(False)
        self.record_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.record_table.setSelectionMode(QTableWidget.SingleSelection)
        self.record_table.setEditTriggers(QTableWidget.NoEditTriggers)
        layout.addWidget(self.record_table, 1)
        
        return widget
    
    def _create_risk_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        self.risk_overview_group = QGroupBox('锈蚀风险评估概览')
        overview_layout = QFormLayout(self.risk_overview_group)
        
        self.risk_level_label = QLabel('-')
        self.risk_level_label.setFont(QFont('Microsoft YaHei', 14, QFont.Bold))
        self.risk_level_label.setAlignment(Qt.AlignCenter)
        overview_layout.addRow('风险等级：', self.risk_level_label)
        
        self.rust_prob_label = QLabel('-')
        overview_layout.addRow('锈蚀概率：', self.rust_prob_label)
        
        self.risk_score_label = QLabel('-')
        overview_layout.addRow('综合评分：', self.risk_score_label)
        
        self.days_since_label = QLabel('-')
        overview_layout.addRow('距上次保养：', self.days_since_label)
        
        layout.addWidget(self.risk_overview_group)
        
        self.quality_group = QGroupBox('保养质量评分')
        quality_layout = QFormLayout(self.quality_group)
        
        self.quality_score_label = QLabel('-')
        self.quality_score_label.setFont(QFont('Microsoft YaHei', 12, QFont.Bold))
        self.quality_score_label.setAlignment(Qt.AlignCenter)
        quality_layout.addRow('质量评分：', self.quality_score_label)
        
        self.quality_level_label = QLabel('-')
        quality_layout.addRow('质量等级：', self.quality_level_label)
        
        self.quality_trend_label = QLabel('-')
        quality_layout.addRow('变化趋势：', self.quality_trend_label)
        
        self.quality_detail_label = QLabel('-')
        self.quality_detail_label.setWordWrap(True)
        self.quality_detail_label.setStyleSheet('color: #555; font-size: 9pt;')
        quality_layout.addRow('详细分析：', self.quality_detail_label)
        
        layout.addWidget(self.quality_group)
        
        self.prediction_group = QGroupBox('保养预测')
        pred_layout = QFormLayout(self.prediction_group)
        
        self.next_maintenance_label = QLabel('-')
        self.next_maintenance_label.setFont(QFont('Microsoft YaHei', 11, QFont.Bold))
        pred_layout.addRow('建议下次保养日期：', self.next_maintenance_label)
        
        self.interval_label = QLabel('-')
        pred_layout.addRow('建议保养间隔：', self.interval_label)
        
        self.urgency_label = QLabel('-')
        pred_layout.addRow('保养提示：', self.urgency_label)
        
        layout.addWidget(self.prediction_group)
        
        self.factors_group = QGroupBox('风险因素分析')
        factors_layout = QFormLayout(self.factors_group)
        
        self.material_factor_label = QLabel('-')
        self.aging_factor_label = QLabel('-')
        self.freq_factor_label = QLabel('-')
        self.humidity_factor_label = QLabel('-')
        self.rust_history_label = QLabel('-')
        self.quality_factor_label = QLabel('-')
        
        factors_layout.addRow('材质风险系数：', self.material_factor_label)
        factors_layout.addRow('年代老化系数：', self.aging_factor_label)
        factors_layout.addRow('保养频率系数：', self.freq_factor_label)
        factors_layout.addRow('环境湿度系数：', self.humidity_factor_label)
        factors_layout.addRow('锈蚀历史系数：', self.rust_history_label)
        factors_layout.addRow('保养质量系数：', self.quality_factor_label)
        
        layout.addWidget(self.factors_group)
        
        layout.addStretch(1)
        
        return widget
    
    def _refresh_sword_list(self):
        swords = self.db.get_all_swords()
        self.sword_table.setRowCount(0)
        
        for sword in swords:
            risk_info = self.risk_analyzer.calculate_risk_score(sword)
            
            row = self.sword_table.rowCount()
            self.sword_table.insertRow(row)
            
            name_item = QTableWidgetItem(sword.get('name', ''))
            name_item.setData(Qt.UserRole, sword['id'])
            self.sword_table.setItem(row, 0, name_item)
            
            self.sword_table.setItem(row, 1, QTableWidgetItem(sword.get('material', '')))
            
            risk_item = QTableWidgetItem(risk_info['risk_level'])
            risk_color = RISK_COLORS.get(risk_info['risk_level'], QColor(100, 100, 100))
            risk_item.setForeground(risk_color)
            risk_item.setTextAlignment(Qt.AlignCenter)
            self.sword_table.setItem(row, 2, risk_item)
    
    def _on_sword_selected(self):
        items = self.sword_table.selectedItems()
        if not items:
            self.current_sword_id = None
            self._clear_detail()
            self._clear_risk_info()
            self._clear_records()
            return
        
        sword_id = items[0].data(Qt.UserRole)
        self.current_sword_id = sword_id
        
        sword = self.db.get_sword(sword_id)
        if sword:
            self._load_detail(sword)
            self._load_risk_info(sword)
            self._load_records(sword_id)
    
    def _clear_detail(self):
        self.detail_name.setText('-')
        self.detail_material.setText('-')
        self.detail_length.setText('-')
        self.detail_year.setText('-')
        self.detail_status.setText('-')
    
    def _clear_risk_info(self):
        self.risk_level_label.setText('-')
        self.risk_level_label.setStyleSheet('')
        self.rust_prob_label.setText('-')
        self.risk_score_label.setText('-')
        self.days_since_label.setText('-')
        self.quality_score_label.setText('-')
        self.quality_score_label.setStyleSheet('')
        self.quality_level_label.setText('-')
        self.quality_trend_label.setText('-')
        self.quality_detail_label.setText('-')
        self.next_maintenance_label.setText('-')
        self.interval_label.setText('-')
        self.urgency_label.setText('-')
        self.urgency_label.setStyleSheet('')
        self.material_factor_label.setText('-')
        self.aging_factor_label.setText('-')
        self.freq_factor_label.setText('-')
        self.humidity_factor_label.setText('-')
        self.rust_history_label.setText('-')
        self.quality_factor_label.setText('-')
    
    def _clear_records(self):
        self.record_table.setRowCount(0)
    
    def _load_detail(self, sword):
        self.detail_name.setText(sword.get('name', '-'))
        self.detail_material.setText(sword.get('material', '-'))
        
        blade_length = sword.get('blade_length')
        self.detail_length.setText(f'{blade_length} cm' if blade_length else '-')
        
        year = sword.get('production_year')
        self.detail_year.setText(str(year) if year else '-')
        
        self.detail_status.setText(sword.get('current_status', '-'))
    
    def _load_risk_info(self, sword):
        risk = self.risk_analyzer.calculate_risk_score(sword)
        prediction = self.risk_analyzer.predict_next_maintenance(sword)
        
        self.risk_level_label.setText(risk['risk_level'])
        risk_color = RISK_COLORS.get(risk['risk_level'], QColor(100, 100, 100))
        self.risk_level_label.setStyleSheet(f'color: rgb({risk_color.red()}, {risk_color.green()}, {risk_color.blue()});')
        
        self.rust_prob_label.setText(risk['rust_probability'])
        self.risk_score_label.setText(str(risk['score']))
        
        days_since = risk.get('days_since_last_maintenance')
        if days_since is not None:
            self.days_since_label.setText(f'{days_since} 天前')
        else:
            self.days_since_label.setText('无保养记录')
        
        quality = risk.get('maintenance_quality', {})
        quality_score = quality.get('score', 50)
        self.quality_score_label.setText(f'{quality_score} / 100')
        
        if quality_score >= 80:
            quality_color = QColor(50, 180, 80)
        elif quality_score >= 65:
            quality_color = QColor(80, 150, 220)
        elif quality_score >= 50:
            quality_color = QColor(100, 100, 100)
        elif quality_score >= 35:
            quality_color = QColor(240, 160, 50)
        else:
            quality_color = QColor(220, 50, 50)
        
        self.quality_score_label.setStyleSheet(
            f'color: rgb({quality_color.red()}, {quality_color.green()}, {quality_color.blue()});'
        )
        
        self.quality_level_label.setText(quality.get('level', '无数据'))
        
        trend_map = {
            'improving': '↗ 改善中',
            'worsening': '↘ 恶化中',
            'stable': '→ 稳定'
        }
        trend_text = trend_map.get(quality.get('trend', 'stable'), '→ 稳定')
        self.quality_trend_label.setText(trend_text)
        
        self.quality_detail_label.setText(quality.get('detail', '-'))
        
        self.next_maintenance_label.setText(prediction['next_maintenance_date'])
        self.interval_label.setText(f"{prediction['recommended_interval_days']} 天")
        
        urgency = prediction['urgency']
        self.urgency_label.setText(urgency)
        if '逾期' in urgency or '尽快' in urgency:
            self.urgency_label.setStyleSheet('color: red; font-weight: bold;')
        else:
            self.urgency_label.setStyleSheet('')
        
        self.material_factor_label.setText(f"{risk['material_factor']:.2f}")
        self.aging_factor_label.setText(f"{risk['aging_factor']:.2f}")
        self.freq_factor_label.setText(f"{risk['maintenance_freq_factor']:.2f}")
        self.humidity_factor_label.setText(f"{risk['humidity_factor']:.2f}")
        self.rust_history_label.setText(f"{risk['rust_history_factor']:.2f}")
        self.quality_factor_label.setText(f"{risk.get('maintenance_quality_factor', 1.0):.2f}")
    
    def _load_records(self, sword_id):
        records = self.db.get_maintenance_records(sword_id)
        self.record_table.setRowCount(0)
        
        for record in records:
            row = self.record_table.rowCount()
            self.record_table.insertRow(row)
            
            id_item = QTableWidgetItem(record['maintenance_date'])
            id_item.setData(Qt.UserRole, record['id'])
            self.record_table.setItem(row, 0, id_item)
            
            self.record_table.setItem(row, 1, QTableWidgetItem(record.get('oil_used') or '-'))
            self.record_table.setItem(row, 2, QTableWidgetItem(record.get('cleaning_method') or '-'))
            
            rust_item = QTableWidgetItem('是' if record.get('rust_removed') else '否')
            rust_item.setTextAlignment(Qt.AlignCenter)
            self.record_table.setItem(row, 3, rust_item)
            
            humidity = record.get('humidity')
            hum_item = QTableWidgetItem(str(humidity) if humidity else '-')
            hum_item.setTextAlignment(Qt.AlignCenter)
            self.record_table.setItem(row, 4, hum_item)
            
            self.record_table.setItem(row, 5, QTableWidgetItem(record.get('notes') or '-'))
    
    def _add_sword(self):
        dialog = SwordDialog(self)
        if dialog.exec_() == QDialog.Accepted:
            data = dialog.get_data()
            try:
                self.db.add_sword(
                    data['name'], data['material'],
                    data['blade_length'], data['production_year'],
                    data['current_status']
                )
                self._refresh_sword_list()
                QMessageBox.information(self, '成功', '藏品添加成功')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'添加失败：{str(e)}')
    
    def _edit_sword(self):
        if not self.current_sword_id:
            QMessageBox.warning(self, '提示', '请先选择一个藏品')
            return
        
        sword = self.db.get_sword(self.current_sword_id)
        if not sword:
            return
        
        dialog = SwordDialog(self, sword)
        if dialog.exec_() == QDialog.Accepted:
            data = dialog.get_data()
            try:
                self.db.update_sword(
                    self.current_sword_id,
                    data['name'], data['material'],
                    data['blade_length'], data['production_year'],
                    data['current_status']
                )
                self._refresh_sword_list()
                self._load_detail(self.db.get_sword(self.current_sword_id))
                QMessageBox.information(self, '成功', '藏品信息已更新')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'更新失败：{str(e)}')
    
    def _delete_sword(self):
        if not self.current_sword_id:
            QMessageBox.warning(self, '提示', '请先选择一个藏品')
            return
        
        reply = QMessageBox.question(
            self, '确认删除',
            '确定要删除该藏品及其所有保养记录吗？此操作不可恢复。',
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            try:
                self.db.delete_sword(self.current_sword_id)
                self.current_sword_id = None
                self._refresh_sword_list()
                self._clear_detail()
                self._clear_risk_info()
                self._clear_records()
                QMessageBox.information(self, '成功', '藏品已删除')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'删除失败：{str(e)}')
    
    def _add_maintenance_record(self):
        if not self.current_sword_id:
            QMessageBox.warning(self, '提示', '请先选择一个藏品')
            return
        
        dialog = MaintenanceDialog(self, sword_id=self.current_sword_id)
        if dialog.exec_() == QDialog.Accepted:
            data = dialog.get_data()
            try:
                self.db.add_maintenance_record(
                    self.current_sword_id,
                    data['maintenance_date'], data['oil_used'],
                    data['cleaning_method'], data['rust_removed'],
                    data['humidity'], data['notes'],
                    data['before_photo_path'], data['after_photo_path']
                )
                self._load_records(self.current_sword_id)
                self._refresh_sword_list()
                sword = self.db.get_sword(self.current_sword_id)
                if sword:
                    self._load_risk_info(sword)
                QMessageBox.information(self, '成功', '保养记录已添加')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'添加失败：{str(e)}')
    
    def _get_selected_record_id(self):
        items = self.record_table.selectedItems()
        if not items:
            return None
        return items[0].data(Qt.UserRole)
    
    def _edit_maintenance_record(self):
        record_id = self._get_selected_record_id()
        if not record_id:
            QMessageBox.warning(self, '提示', '请先选择一条保养记录')
            return
        
        record = self.db.get_maintenance_record(record_id)
        if not record:
            return
        
        dialog = MaintenanceDialog(self, record=record)
        if dialog.exec_() == QDialog.Accepted:
            data = dialog.get_data()
            try:
                self.db.update_maintenance_record(
                    record_id,
                    data['maintenance_date'], data['oil_used'],
                    data['cleaning_method'], data['rust_removed'],
                    data['humidity'], data['notes'],
                    data['before_photo_path'], data['after_photo_path']
                )
                self._load_records(self.current_sword_id)
                self._refresh_sword_list()
                sword = self.db.get_sword(self.current_sword_id)
                if sword:
                    self._load_risk_info(sword)
                QMessageBox.information(self, '成功', '保养记录已更新')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'更新失败：{str(e)}')
    
    def _delete_maintenance_record(self):
        record_id = self._get_selected_record_id()
        if not record_id:
            QMessageBox.warning(self, '提示', '请先选择一条保养记录')
            return
        
        reply = QMessageBox.question(
            self, '确认删除',
            '确定要删除这条保养记录吗？',
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            try:
                self.db.delete_maintenance_record(record_id)
                self._load_records(self.current_sword_id)
                self._refresh_sword_list()
                sword = self.db.get_sword(self.current_sword_id)
                if sword:
                    self._load_risk_info(sword)
                QMessageBox.information(self, '成功', '保养记录已删除')
            except Exception as e:
                QMessageBox.critical(self, '错误', f'删除失败：{str(e)}')
    
    def _export_pdf_report(self):
        if not self.current_sword_id:
            QMessageBox.warning(self, '提示', '请先选择一个藏品')
            return
        
        sword = self.db.get_sword(self.current_sword_id)
        if not sword:
            return
        
        default_name = f"保养报告_{sword.get('name', '藏品')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        path, _ = QFileDialog.getSaveFileName(
            self, '保存PDF报告', default_name,
            'PDF文件 (*.pdf)'
        )
        
        if not path:
            return
        
        try:
            records = self.db.get_maintenance_records(self.current_sword_id)
            risk_info = self.risk_analyzer.calculate_risk_score(sword)
            maintenance_info = self.risk_analyzer.predict_next_maintenance(sword)
            
            self.pdf_generator.generate_report(
                sword, records, risk_info, maintenance_info, path
            )
            
            reply = QMessageBox.question(
                self, '导出成功',
                f'报告已保存至：\n{path}\n\n是否打开文件？',
                QMessageBox.Yes | QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                import subprocess
                if sys.platform == 'win32':
                    os.startfile(path)
                elif sys.platform == 'darwin':
                    subprocess.run(['open', path])
                else:
                    subprocess.run(['xdg-open', path])
        except Exception as e:
            QMessageBox.critical(self, '错误', f'导出失败：{str(e)}')
    
    def _open_wear_compare(self):
        if not self.current_sword_id:
            QMessageBox.warning(self, '提示', '请先选择一个藏品')
            return
        
        if not WEAR_COMPARE_AVAILABLE:
            QMessageBox.warning(
                self, '功能不可用',
                '磨损对比功能需要安装以下依赖：\n'
                '- opencv-python\n'
                '- opencv-contrib-python\n'
                '- numpy\n\n'
                '请运行: pip install opencv-python opencv-contrib-python numpy'
            )
            return
        
        try:
            dialog = WearCompareDialog(self, db=self.db, sword_id=self.current_sword_id)
            dialog.exec_()
        except Exception as e:
            QMessageBox.critical(self, '错误', f'打开磨损对比失败：{str(e)}')

def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    
    font = QFont('Microsoft YaHei', 9)
    app.setFont(font)
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
