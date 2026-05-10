import sys
from datetime import datetime
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLabel, QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox, 
                             QPushButton, QTableWidget, QTableWidgetItem, QMessageBox,
                             QDateEdit, QHeaderView, QSplitter, QGroupBox, QFormLayout)
from PyQt5.QtCore import Qt, QDate
from PyQt5.QtGui import QFont

import db
from planner import generate_8_week_plan
from plan_window import PlanWindow
from heart_rate import estimate_max_hr, calculate_heart_rate_zones

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("跑步训练计划生成器")
        self.setMinimumSize(1200, 700)
        
        self.init_db()
        self.init_ui()
        self.load_plans()
    
    def init_db(self):
        db.init_db()
    
    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        
        title_label = QLabel("🏃 跑步训练计划生成器")
        title_font = QFont()
        title_font.setPointSize(18)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(title_label)
        
        splitter = QSplitter(Qt.Horizontal)
        
        create_group = QGroupBox("创建新计划")
        create_layout = QVBoxLayout(create_group)
        
        form_layout = QFormLayout()
        
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("例如：半马训练计划 - 2026")
        form_layout.addRow("计划名称:", self.name_input)
        
        self.goal_combo = QComboBox()
        self.goal_combo.addItems(["5公里", "半马", "全马"])
        form_layout.addRow("训练目标:", self.goal_combo)
        
        self.current_distance = QDoubleSpinBox()
        self.current_distance.setRange(1, 200)
        self.current_distance.setValue(15)
        self.current_distance.setSuffix(" 公里/周")
        form_layout.addRow("当前周跑量:", self.current_distance)
        
        self.training_days = QSpinBox()
        self.training_days.setRange(3, 7)
        self.training_days.setValue(4)
        self.training_days.setSuffix(" 天")
        form_layout.addRow("每周训练天数:", self.training_days)
        
        self.start_date = QDateEdit()
        self.start_date.setDate(QDate.currentDate())
        self.start_date.setCalendarPopup(True)
        form_layout.addRow("开始日期:", self.start_date)
        
        hr_group = QGroupBox("❤️ 心率设置（可选）")
        hr_layout = QFormLayout(hr_group)
        
        self.age_spin = QSpinBox()
        self.age_spin.setRange(10, 100)
        self.age_spin.setValue(30)
        self.age_spin.setSuffix(" 岁")
        self.age_spin.valueChanged.connect(self.update_estimated_hr)
        hr_layout.addRow("年龄:", self.age_spin)
        
        self.gender_combo = QComboBox()
        self.gender_combo.addItems(["未指定", "男", "女"])
        self.gender_combo.currentIndexChanged.connect(self.update_estimated_hr)
        hr_layout.addRow("性别:", self.gender_combo)
        
        self.estimated_hr_label = QLabel("预估最大心率: 190 bpm")
        self.estimated_hr_label.setStyleSheet("color: #2E5090; font-weight: bold;")
        hr_layout.addRow("", self.estimated_hr_label)
        
        calc_hr_btn = QPushButton("🔄 自动计算最大心率")
        calc_hr_btn.clicked.connect(self.auto_calculate_max_hr)
        hr_layout.addRow("", calc_hr_btn)
        
        self.max_hr_spin = QSpinBox()
        self.max_hr_spin.setRange(100, 220)
        self.max_hr_spin.setValue(190)
        self.max_hr_spin.setSuffix(" bpm")
        self.max_hr_spin.setSpecialValueText("未设置")
        hr_layout.addRow("最大心率:", self.max_hr_spin)
        
        create_layout.addLayout(form_layout)
        create_layout.addWidget(hr_group)
        
        create_btn = QPushButton("📝 生成训练计划")
        create_btn.setMinimumHeight(40)
        create_btn.clicked.connect(self.create_new_plan)
        create_layout.addWidget(create_btn)
        
        create_layout.addStretch()
        
        splitter.addWidget(create_group)
        
        plans_group = QGroupBox("历史计划列表")
        plans_layout = QVBoxLayout(plans_group)
        
        self.plans_table = QTableWidget()
        self.plans_table.setColumnCount(7)
        self.plans_table.setHorizontalHeaderLabels(["ID", "计划名称", "目标", "当前跑量", "最大心率", "开始日期", "创建时间"])
        self.plans_table.horizontalHeader().setStretchLastSection(True)
        self.plans_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        self.plans_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.plans_table.setSelectionMode(QTableWidget.SingleSelection)
        self.plans_table.cellDoubleClicked.connect(self.open_plan_detail)
        plans_layout.addWidget(self.plans_table)
        
        button_layout = QHBoxLayout()
        
        view_btn = QPushButton("👁️ 查看/编辑计划")
        view_btn.clicked.connect(self.open_plan_detail)
        button_layout.addWidget(view_btn)
        
        delete_btn = QPushButton("🗑️ 删除计划")
        delete_btn.clicked.connect(self.delete_plan)
        button_layout.addWidget(delete_btn)
        
        compare_btn = QPushButton("📊 对比选中计划")
        compare_btn.clicked.connect(self.compare_plans)
        button_layout.addWidget(compare_btn)
        
        refresh_btn = QPushButton("🔄 刷新列表")
        refresh_btn.clicked.connect(self.load_plans)
        button_layout.addWidget(refresh_btn)
        
        plans_layout.addLayout(button_layout)
        
        splitter.addWidget(plans_group)
        splitter.setSizes([400, 800])
        
        main_layout.addWidget(splitter)
        
        self.plan_windows = []
    
    def load_plans(self):
        plans = db.get_all_plans()
        self.plans_table.setRowCount(len(plans))
        
        for row, plan in enumerate(plans):
            self.plans_table.setItem(row, 0, QTableWidgetItem(str(plan['id'])))
            self.plans_table.setItem(row, 1, QTableWidgetItem(plan['name']))
            self.plans_table.setItem(row, 2, QTableWidgetItem(plan['goal']))
            self.plans_table.setItem(row, 3, QTableWidgetItem(f"{plan['current_weekly_distance']} km"))
            
            max_hr = plan.get('max_heart_rate', 0)
            if max_hr and max_hr > 0:
                hr_item = QTableWidgetItem(f"❤️ {max_hr} bpm")
            else:
                hr_item = QTableWidgetItem("未设置")
            self.plans_table.setItem(row, 4, hr_item)
            
            self.plans_table.setItem(row, 5, QTableWidgetItem(plan['start_date']))
            
            created_at = datetime.fromisoformat(plan['created_at'])
            self.plans_table.setItem(row, 6, QTableWidgetItem(created_at.strftime('%Y-%m-%d %H:%M')))
        
        self.plans_table.resizeColumnsToContents()
    
    def update_estimated_hr(self):
        age = self.age_spin.value()
        gender_text = self.gender_combo.currentText()
        
        if gender_text == '男':
            gender = 'male'
        elif gender_text == '女':
            gender = 'female'
        else:
            gender = 'unknown'
        
        estimated = estimate_max_hr(age, gender=gender)
        if estimated:
            self.estimated_hr_label.setText(f"预估最大心率: {estimated} bpm")
        else:
            self.estimated_hr_label.setText("预估最大心率: 无法计算")
    
    def auto_calculate_max_hr(self):
        age = self.age_spin.value()
        gender_text = self.gender_combo.currentText()
        
        if gender_text == '男':
            gender = 'male'
        elif gender_text == '女':
            gender = 'female'
        else:
            gender = 'unknown'
        
        estimated = estimate_max_hr(age, gender=gender)
        if estimated:
            self.max_hr_spin.setValue(estimated)
            QMessageBox.information(
                self, "计算完成",
                f"根据您的年龄({age}岁)和性别({gender_text})，\n"
                f"预估最大心率为: {estimated} bpm\n\n"
                "公式说明:\n"
                "- 男性: 208 - 0.7 × 年龄\n"
                "- 女性: 206 - 0.88 × 年龄\n"
                "- 通用: 220 - 年龄"
            )
    
    def create_new_plan(self):
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "输入错误", "请输入计划名称！")
            return
        
        goal = self.goal_combo.currentText()
        current_distance = self.current_distance.value()
        training_days = self.training_days.value()
        start_date = self.start_date.date().toString('yyyy-MM-dd')
        max_hr = self.max_hr_spin.value()
        
        try:
            training_days_data = generate_8_week_plan(
                goal, current_distance, training_days, start_date
            )
            
            plan_id = db.create_plan(
                name, goal, current_distance, training_days, start_date, training_days_data, max_hr
            )
            
            success_msg = f"计划创建成功！\n计划ID: {plan_id}"
            if max_hr > 0:
                zones = calculate_heart_rate_zones(max_hr)
                if zones:
                    zone_info = "\n\n您的心率区间:"
                    for zone_key, zone_info_data in zones.items():
                        zone_info += f"\n  {zone_info_data['name']}: {zone_info_data['range']} bpm"
                    success_msg += zone_info
            
            QMessageBox.information(self, "成功", success_msg)
            
            self.name_input.clear()
            self.load_plans()
            
            reply = QMessageBox.question(
                self, "查看计划", 
                "是否立即查看生成的训练计划？",
                QMessageBox.Yes | QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                self.open_plan_by_id(plan_id)
                
        except Exception as e:
            QMessageBox.critical(self, "错误", f"创建计划失败: {str(e)}")
    
    def open_plan_detail(self, row=None, column=None):
        selected_rows = self.plans_table.selectionModel().selectedRows()
        if not selected_rows:
            QMessageBox.information(self, "提示", "请先选择一个计划")
            return
        
        row = selected_rows[0].row()
        plan_id_item = self.plans_table.item(row, 0)
        if plan_id_item:
            plan_id = int(plan_id_item.text())
            self.open_plan_by_id(plan_id)
    
    def open_plan_by_id(self, plan_id):
        plan = db.get_plan(plan_id)
        if plan:
            window = PlanWindow(plan, self)
            self.plan_windows.append(window)
            window.show()
            window.closed.connect(self.on_plan_window_closed)
        else:
            QMessageBox.warning(self, "错误", "计划不存在")
    
    def on_plan_window_closed(self, window):
        if window in self.plan_windows:
            self.plan_windows.remove(window)
        self.load_plans()
    
    def delete_plan(self):
        selected_rows = self.plans_table.selectionModel().selectedRows()
        if not selected_rows:
            QMessageBox.information(self, "提示", "请先选择一个计划")
            return
        
        row = selected_rows[0].row()
        plan_id_item = self.plans_table.item(row, 0)
        plan_name_item = self.plans_table.item(row, 1)
        
        if plan_id_item:
            plan_id = int(plan_id_item.text())
            plan_name = plan_name_item.text() if plan_name_item else "未知计划"
            
            reply = QMessageBox.question(
                self, "确认删除",
                f"确定要删除计划「{plan_name}」吗？\n此操作不可恢复！",
                QMessageBox.Yes | QMessageBox.No, QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                db.delete_plan(plan_id)
                self.load_plans()
                QMessageBox.information(self, "成功", "计划已删除")
    
    def compare_plans(self):
        plans = db.get_all_plans()
        if len(plans) < 2:
            QMessageBox.information(self, "提示", "需要至少2个计划才能对比")
            return
        
        from compare_window import CompareWindow
        compare_window = CompareWindow(plans, self)
        compare_window.exec_()
