from PyQt5.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, 
                             QTableWidget, QTableWidgetItem, QHeaderView, QComboBox,
                             QGroupBox, QCheckBox, QScrollArea, QWidget)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont, QColor, QBrush

import db
from planner import PACE_TYPES

class CompareWindow(QDialog):
    def __init__(self, all_plans, parent=None):
        super().__init__(parent)
        self.all_plans = all_plans
        self.selected_plans = []
        
        self.setWindowTitle("计划对比")
        self.setMinimumSize(1200, 800)
        
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        title_label = QLabel("📊 训练计划对比")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(title_label)
        
        selection_group = QGroupBox("选择要对比的计划")
        selection_layout = QVBoxLayout(selection_group)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setMaximumHeight(150)
        
        scroll_content = QWidget()
        self.checkbox_layout = QVBoxLayout(scroll_content)
        
        self.plan_checkboxes = []
        for plan in self.all_plans:
            cb = QCheckBox(f"{plan['name']} ({plan['goal']})")
            cb.setProperty('plan_id', plan['id'])
            cb.stateChanged.connect(self.on_plan_selection_changed)
            self.plan_checkboxes.append(cb)
            self.checkbox_layout.addWidget(cb)
        
        scroll.setWidget(scroll_content)
        selection_layout.addWidget(scroll)
        
        button_layout = QHBoxLayout()
        select_all_btn = QPushButton("全选")
        select_all_btn.clicked.connect(self.select_all)
        button_layout.addWidget(select_all_btn)
        
        clear_all_btn = QPushButton("清除选择")
        clear_all_btn.clicked.connect(self.clear_all)
        button_layout.addWidget(clear_all_btn)
        
        compare_btn = QPushButton("📊 开始对比")
        compare_btn.clicked.connect(self.do_compare)
        button_layout.addWidget(compare_btn)
        
        button_layout.addStretch()
        
        selection_layout.addLayout(button_layout)
        layout.addWidget(selection_group)
        
        self.result_group = QGroupBox("对比结果")
        result_layout = QVBoxLayout(self.result_group)
        
        self.compare_table = QTableWidget()
        self.compare_table.horizontalHeader().setStretchLastSection(True)
        self.compare_table.verticalHeader().setVisible(False)
        result_layout.addWidget(self.compare_table)
        
        layout.addWidget(self.result_group)
        
        close_btn = QPushButton("关闭")
        close_btn.clicked.connect(self.close)
        layout.addWidget(close_btn)
    
    def on_plan_selection_changed(self, state):
        pass
    
    def select_all(self):
        for cb in self.plan_checkboxes:
            cb.setChecked(True)
    
    def clear_all(self):
        for cb in self.plan_checkboxes:
            cb.setChecked(False)
    
    def do_compare(self):
        selected_ids = []
        for cb in self.plan_checkboxes:
            if cb.isChecked():
                selected_ids.append(cb.property('plan_id'))
        
        if len(selected_ids) < 2:
            from PyQt5.QtWidgets import QMessageBox
            QMessageBox.warning(self, "选择不足", "请至少选择2个计划进行对比")
            return
        
        plans_data = []
        for plan_id in selected_ids:
            plan = db.get_plan(plan_id)
            if plan:
                plans_data.append(plan)
        
        self.show_comparison(plans_data)
    
    def show_comparison(self, plans_data):
        headers = ['对比项'] + [p['name'] for p in plans_data]
        self.compare_table.setColumnCount(len(headers))
        self.compare_table.setHorizontalHeaderLabels(headers)
        
        comparison_data = []
        
        comparison_data.append(['训练目标'] + [p['goal'] for p in plans_data])
        comparison_data.append(['初始周跑量 (km)'] + [str(p['current_weekly_distance']) for p in plans_data])
        comparison_data.append(['每周训练天数'] + [str(p['training_days']) for p in plans_data])
        comparison_data.append(['开始日期'] + [p['start_date'] for p in plans_data])
        
        for p in plans_data:
            total_distance = sum(d['distance'] for d in p['training_days'])
            weekly_distances = {}
            for day in p['training_days']:
                week = day['week_number']
                if week not in weekly_distances:
                    weekly_distances[week] = 0
                weekly_distances[week] += day['distance']
            
            p['_total_distance'] = total_distance
            p['_weekly_distances'] = weekly_distances
            
            pace_counts = {}
            for day in p['training_days']:
                pace = day['pace_type']
                if pace not in pace_counts:
                    pace_counts[pace] = 0
                pace_counts[pace] += 1
            p['_pace_counts'] = pace_counts
        
        comparison_data.append(['总训练距离 (km)'] + [f"{p['_total_distance']:.1f}" for p in plans_data])
        comparison_data.append(['平均每周距离 (km)'] + [f"{p['_total_distance']/8:.1f}" for p in plans_data])
        
        for week in range(1, 9):
            row = [f"第{week}周跑量 (km)"]
            for p in plans_data:
                row.append(f"{p['_weekly_distances'].get(week, 0):.1f}")
            comparison_data.append(row)
        
        for pace_key, pace_name in PACE_TYPES.items():
            if pace_key == 'rest':
                continue
            row = [f"{pace_name}天数"]
            for p in plans_data:
                row.append(str(p['_pace_counts'].get(pace_key, 0)))
            comparison_data.append(row)
        
        comparison_data.append(['休息日数'] + [str(p['_pace_counts'].get('rest', 0)) for p in plans_data])
        
        comparison_data.append(['总训练天数'] + 
            [str(sum(1 for d in p['training_days'] if d['pace_type'] != 'rest')) for p in plans_data])
        
        self.compare_table.setRowCount(len(comparison_data))
        
        for row_idx, row_data in enumerate(comparison_data):
            for col_idx, cell_data in enumerate(row_data):
                item = QTableWidgetItem(cell_data)
                item.setTextAlignment(Qt.AlignCenter)
                
                if col_idx == 0:
                    item.setFont(QFont("Arial", 10, QFont.Bold))
                    if row_idx in [0, 5, 6]:
                        item.setBackground(QBrush(QColor(232, 240, 254)))
                
                self.compare_table.setItem(row_idx, col_idx, item)
        
        self.compare_table.resizeColumnsToContents()
        self.compare_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
