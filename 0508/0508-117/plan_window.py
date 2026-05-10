from datetime import datetime
from PyQt5.QtWidgets import (QDialog, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLabel, QPushButton, QTableWidget, QTableWidgetItem, 
                             QMessageBox, QHeaderView, QGroupBox, QTabWidget,
                             QDoubleSpinBox, QComboBox, QTextEdit, QSplitter,
                             QFileDialog, QMenu, QAction, QApplication, QClipboard)
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QFont, QColor, QBrush, QContextMenuEvent

import db
from planner import rebalance_plan, PACE_TYPES, PACE_DISTANCE_RANGES
from exporter import export_to_excel, export_to_pdf
from heart_rate import (
    calculate_heart_rate_zones, 
    calculate_hr_for_pace,
    get_hr_zone_color,
    HEART_RATE_ZONES
)

WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

PACE_COLORS = {
    'easy': QColor(144, 238, 144),
    'tempo': QColor(255, 215, 0),
    'interval': QColor(255, 99, 71),
    'long': QColor(135, 206, 250),
    'rest': QColor(211, 211, 211)
}

class PlanWindow(QDialog):
    closed = pyqtSignal(object)
    
    def __init__(self, plan, parent=None):
        super().__init__(parent)
        self.plan = plan
        self.plan_id = plan['id']
        self.training_days = plan['training_days'].copy()
        self.modified = False
        
        self.setWindowTitle(f"训练计划 - {plan['name']}")
        self.setMinimumSize(1400, 900)
        
        self.init_ui()
        self.load_plan_data()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        self.max_hr = self.plan.get('max_heart_rate', 0)
        self.hr_zones = calculate_heart_rate_zones(self.max_hr) if self.max_hr > 0 else None
        
        info_layout = QHBoxLayout()
        
        info_group = QGroupBox("📋 计划信息")
        info_form = QVBoxLayout(info_group)
        
        plan_info = f"""
        <b>计划名称:</b> {self.plan['name']}<br>
        <b>训练目标:</b> {self.plan['goal']}<br>
        <b>初始周跑量:</b> {self.plan['current_weekly_distance']} 公里<br>
        <b>每周训练天数:</b> {self.plan['training_days']} 天<br>
        <b>开始日期:</b> {self.plan['start_date']}
        """
        
        if self.max_hr > 0:
            plan_info += f"<br><b>最大心率:</b> {self.max_hr} bpm ❤️"
        else:
            plan_info += "<br><b>最大心率:</b> 未设置"
        
        info_label = QLabel(plan_info)
        info_label.setTextFormat(Qt.RichText)
        info_form.addWidget(info_label)
        
        info_layout.addWidget(info_group)
        
        if self.hr_zones:
            hr_group = QGroupBox("❤️ 心率区间")
            hr_layout = QVBoxLayout(hr_group)
            
            hr_table = QTableWidget()
            hr_table.setColumnCount(3)
            hr_table.setHorizontalHeaderLabels(['区间', '心率范围', '说明'])
            hr_table.horizontalHeader().setStretchLastSection(True)
            hr_table.verticalHeader().setVisible(False)
            hr_table.setEditTriggers(QTableWidget.NoEditTriggers)
            hr_table.setRowCount(5)
            
            zone_order = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5']
            for row, zone_key in enumerate(zone_order):
                zone = self.hr_zones[zone_key]
                
                zone_item = QTableWidgetItem(zone['name'])
                zone_item.setTextAlignment(Qt.AlignCenter)
                zone_item.setFont(QFont("Arial", 10, QFont.Bold))
                hr_table.setItem(row, 0, zone_item)
                
                range_item = QTableWidgetItem(f"{zone['min_hr']}-{zone['max_hr']} bpm")
                range_item.setTextAlignment(Qt.AlignCenter)
                hr_table.setItem(row, 1, range_item)
                
                desc_item = QTableWidgetItem(f"{zone['description']} (RPE: {zone['rpe']})")
                hr_table.setItem(row, 2, desc_item)
                
                color_hex = get_hr_zone_color(zone_key)
                color = QColor(color_hex)
                for col in range(3):
                    item = hr_table.item(row, col)
                    if item:
                        item.setBackground(QBrush(color))
            
            hr_table.resizeColumnsToContents()
            hr_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
            hr_table.setMaximumHeight(160)
            hr_layout.addWidget(hr_table)
            
            info_layout.addWidget(hr_group)
        
        stats_group = QGroupBox("📊 计划统计")
        stats_layout = QVBoxLayout(stats_group)
        self.stats_label = QLabel("")
        stats_layout.addWidget(self.stats_label)
        info_layout.addWidget(stats_group)
        
        info_layout.addStretch()
        
        layout.addLayout(info_layout)
        
        self.tab_widget = QTabWidget()
        layout.addWidget(self.tab_widget)
        
        self.create_overview_tab()
        self.create_weekly_tabs()
        
        button_layout = QHBoxLayout()
        
        save_btn = QPushButton("💾 保存修改")
        save_btn.clicked.connect(self.save_changes)
        button_layout.addWidget(save_btn)
        
        export_excel_btn = QPushButton("📊 导出为Excel")
        export_excel_btn.clicked.connect(self.export_excel)
        button_layout.addWidget(export_excel_btn)
        
        export_pdf_btn = QPushButton("📄 导出为PDF")
        export_pdf_btn.clicked.connect(self.export_pdf)
        button_layout.addWidget(export_pdf_btn)
        
        button_layout.addStretch()
        
        close_btn = QPushButton("❌ 关闭")
        close_btn.clicked.connect(self.close)
        button_layout.addWidget(close_btn)
        
        layout.addLayout(button_layout)
    
    def create_overview_tab(self):
        overview_widget = QWidget()
        overview_layout = QVBoxLayout(overview_widget)
        
        self.overview_table = QTableWidget()
        self.overview_table.setColumnCount(9)
        
        headers = ['周次'] + WEEKDAYS
        self.overview_table.setHorizontalHeaderLabels(headers)
        self.overview_table.horizontalHeader().setStretchLastSection(True)
        self.overview_table.verticalHeader().setVisible(False)
        self.overview_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.overview_table.setSelectionBehavior(QTableWidget.SelectItems)
        self.overview_table.setSelectionMode(QTableWidget.SingleSelection)
        
        overview_layout.addWidget(self.overview_table)
        
        legend_group = QGroupBox("配速类型说明")
        legend_layout = QHBoxLayout(legend_group)
        
        for pace_type, display_name in PACE_TYPES.items():
            color_label = QLabel("    ")
            color_label.setAutoFillBackground(True)
            palette = color_label.palette()
            palette.setColor(color_label.backgroundRole(), PACE_COLORS.get(pace_type, QColor(255, 255, 255)))
            color_label.setPalette(palette)
            legend_layout.addWidget(color_label)
            legend_layout.addWidget(QLabel(display_name))
        
        legend_layout.addStretch()
        overview_layout.addWidget(legend_group)
        
        self.tab_widget.addTab(overview_widget, "📋 总览")
    
    def create_weekly_tabs(self):
        self.week_tables = {}
        self.week_data = {}
        
        for week in range(1, 9):
            week_widget = QWidget()
            week_layout = QVBoxLayout(week_widget)
            
            table = QTableWidget()
            table.setColumnCount(7)
            table.setHorizontalHeaderLabels(WEEKDAYS)
            table.horizontalHeader().setStretchLastSection(True)
            table.verticalHeader().setVisible(False)
            table.setEditTriggers(QTableWidget.NoEditTriggers)
            table.setSelectionBehavior(QTableWidget.SelectItems)
            table.setSelectionMode(QTableWidget.SingleSelection)
            table.cellDoubleClicked.connect(lambda r, c, w=week: self.edit_day(w, r, c))
            table.setContextMenuPolicy(Qt.CustomContextMenu)
            table.customContextMenuRequested.connect(lambda pos, w=week: self.show_context_menu(pos, w))
            
            self.week_tables[week] = table
            week_layout.addWidget(table)
            
            edit_info = QLabel("💡 双击单元格或右键菜单编辑当天训练计划")
            edit_info.setStyleSheet("color: gray; font-style: italic;")
            week_layout.addWidget(edit_info)
            
            self.tab_widget.addTab(week_widget, f"第 {week} 周")
    
    def load_plan_data(self):
        week_data = {}
        for day in self.training_days:
            week = day['week_number']
            day_idx = day['day_of_week'] - 1
            if week not in week_data:
                week_data[week] = {}
            week_data[week][day_idx] = day
        
        self.week_data = week_data
        
        self.update_overview_table()
        self.update_all_week_tables()
        self.update_stats()
    
    def update_overview_table(self):
        self.overview_table.setRowCount(8)
        
        for week in range(1, 9):
            week_item = QTableWidgetItem(f"第 {week} 周")
            week_item.setFont(QFont("Arial", 10, QFont.Bold))
            self.overview_table.setItem(week - 1, 0, week_item)
            
            week_days = self.week_data.get(week, {})
            for day_idx in range(7):
                day = week_days.get(day_idx)
                if day:
                    display_text = self.format_day_display(day)
                    item = QTableWidgetItem(display_text)
                    item.setTextAlignment(Qt.AlignCenter)
                    
                    color = PACE_COLORS.get(day['pace_type'])
                    if color:
                        item.setBackground(QBrush(color))
                    
                    self.overview_table.setItem(week - 1, day_idx + 1, item)
                else:
                    item = QTableWidgetItem("-")
                    item.setTextAlignment(Qt.AlignCenter)
                    self.overview_table.setItem(week - 1, day_idx + 1, item)
        
        self.overview_table.resizeColumnsToContents()
        self.overview_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
    
    def update_all_week_tables(self):
        for week in range(1, 9):
            self.update_week_table(week)
    
    def update_week_table(self, week):
        table = self.week_tables[week]
        
        row_count = 3 if self.max_hr > 0 else 2
        table.setRowCount(row_count)
        
        week_days = self.week_data.get(week, {})
        
        for day_idx in range(7):
            day = week_days.get(day_idx)
            if day:
                distance_item = QTableWidgetItem(f"{day['distance']} km")
                distance_item.setTextAlignment(Qt.AlignCenter)
                distance_item.setFont(QFont("Arial", 12, QFont.Bold))
                
                color = PACE_COLORS.get(day['pace_type'])
                if color:
                    distance_item.setBackground(QBrush(color))
                
                table.setItem(0, day_idx, distance_item)
                
                pace_item = QTableWidgetItem(PACE_TYPES.get(day['pace_type'], day['pace_type']))
                pace_item.setTextAlignment(Qt.AlignCenter)
                if color:
                    pace_item.setBackground(QBrush(color))
                table.setItem(1, day_idx, pace_item)
                
                if self.max_hr > 0:
                    hr_info = calculate_hr_for_pace(day['pace_type'], self.max_hr)
                    if hr_info and day['pace_type'] != 'rest':
                        hr_text = f"❤️ {hr_info['range']}\n({hr_info['zone_name']})"
                        hr_item = QTableWidgetItem(hr_text)
                        hr_item.setTextAlignment(Qt.AlignCenter)
                        
                        hr_color_hex = get_hr_zone_color(hr_info['zone'])
                        hr_color = QColor(hr_color_hex)
                        hr_item.setBackground(QBrush(hr_color))
                        
                        table.setItem(2, day_idx, hr_item)
                    elif day['pace_type'] == 'rest':
                        rest_hr_item = QTableWidgetItem("😴 休息")
                        rest_hr_item.setTextAlignment(Qt.AlignCenter)
                        rest_hr_item.setBackground(QBrush(QColor(211, 211, 211)))
                        table.setItem(2, day_idx, rest_hr_item)
                    else:
                        table.setItem(2, day_idx, QTableWidgetItem(""))
            else:
                item = QTableWidgetItem("-")
                item.setTextAlignment(Qt.AlignCenter)
                table.setItem(0, day_idx, item)
                table.setItem(1, day_idx, QTableWidgetItem(""))
                if self.max_hr > 0:
                    table.setItem(2, day_idx, QTableWidgetItem(""))
        
        table.resizeRowsToContents()
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
    
    def format_day_display(self, day):
        if day['pace_type'] == 'rest':
            return "休息"
        
        base_text = f"{day['distance']}km\n{PACE_TYPES.get(day['pace_type'], day['pace_type'])}"
        
        if self.max_hr > 0:
            hr_info = calculate_hr_for_pace(day['pace_type'], self.max_hr)
            if hr_info:
                base_text += f"\n❤️ {hr_info['range']}"
        
        return base_text
    
    def update_stats(self):
        total_distance = sum(day['distance'] for day in self.training_days)
        
        weekly_distances = {}
        for day in self.training_days:
            week = day['week_number']
            if week not in weekly_distances:
                weekly_distances[week] = 0
            weekly_distances[week] += day['distance']
        
        pace_counts = {}
        for day in self.training_days:
            pace = day['pace_type']
            if pace not in pace_counts:
                pace_counts[pace] = 0
            pace_counts[pace] += 1
        
        stats_text = f"""
        <b>总训练距离:</b> {total_distance:.1f} 公里<br>
        <b>平均每周距离:</b> {total_distance / 8:.1f} 公里<br>
        <b>训练天数:</b> {sum(1 for d in self.training_days if d['pace_type'] != 'rest')} 天<br>
        """
        
        if weekly_distances:
            max_week = max(weekly_distances.items(), key=lambda x: x[1])
            stats_text += f"<b>最大周跑量:</b> 第{max_week[0]}周 {max_week[1]:.1f} 公里<br>"
        
        if self.max_hr > 0 and self.hr_zones:
            hr_zone_counts = {}
            for day in self.training_days:
                if day['pace_type'] == 'rest':
                    continue
                hr_info = calculate_hr_for_pace(day['pace_type'], self.max_hr)
                if hr_info:
                    zone = hr_info['zone']
                    if zone not in hr_zone_counts:
                        hr_zone_counts[zone] = 0
                    hr_zone_counts[zone] += 1
            
            if hr_zone_counts:
                stats_text += "<br><b>心率区间分布:</b><br>"
                zone_order = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5']
                for zone in zone_order:
                    if zone in hr_zone_counts:
                        zone_info = self.hr_zones[zone]
                        stats_text += f"&nbsp;&nbsp;{zone_info['name']} ({zone_info['range']}): {hr_zone_counts[zone]}天<br>"
        
        self.stats_label.setText(stats_text)
    
    def edit_day(self, week, row, col):
        day = self.week_data.get(week, {}).get(col)
        if not day:
            return
        
        if day['pace_type'] == 'rest':
            reply = QMessageBox.question(
                self, "修改休息日",
                "这是一个休息日，要将其改为训练日吗？",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply != QMessageBox.Yes:
                return
        
        dialog = EditDayDialog(day, self, self.max_hr)
        if dialog.exec_() == QDialog.Accepted:
            new_distance = dialog.get_distance()
            new_pace = dialog.get_pace_type()
            new_notes = dialog.get_notes()
            
            old_distance = day['distance']
            old_pace = day['pace_type']
            
            if new_distance != old_distance or new_pace != old_pace:
                reply = QMessageBox.question(
                    self, "重新平衡计划",
                    "是否要自动调整后续训练日的跑量以保持整体平衡？\n\n"
                    "选择「是」: 后续训练日会自动调整\n"
                    "选择「否」: 仅修改当天，不影响其他日期",
                    QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel
                )
                
                if reply == QMessageBox.Cancel:
                    return
                
                global_day_index = None
                for i, d in enumerate(self.training_days):
                    if d['week_number'] == week and d['day_of_week'] == col + 1:
                        global_day_index = i
                        break
                
                if global_day_index is not None:
                    if reply == QMessageBox.Yes:
                        self.training_days = rebalance_plan(
                            self.training_days, global_day_index, new_distance
                        )
                        self.training_days[global_day_index]['pace_type'] = new_pace
                        self.training_days[global_day_index]['notes'] = new_notes
                    else:
                        self.training_days[global_day_index]['distance'] = new_distance
                        self.training_days[global_day_index]['pace_type'] = new_pace
                        self.training_days[global_day_index]['notes'] = new_notes
                    
                    self.modified = True
                    self.rebuild_week_data()
                    self.load_plan_data()
    
    def show_context_menu(self, pos, week):
        table = self.week_tables[week]
        index = table.indexAt(pos)
        if not index.isValid():
            return
        
        col = index.column()
        day = self.week_data.get(week, {}).get(col)
        if not day:
            return
        
        menu = QMenu(self)
        
        edit_action = QAction("✏️ 编辑当天", self)
        edit_action.triggered.connect(lambda: self.edit_day(week, index.row(), col))
        menu.addAction(edit_action)
        
        menu.addSeparator()
        
        if day['pace_type'] != 'rest':
            rest_action = QAction("😴 改为休息日", self)
            rest_action.triggered.connect(lambda: self.set_as_rest(week, col))
            menu.addAction(rest_action)
        
        if day['pace_type'] == 'rest':
            train_action = QAction("🏃 改为训练日", self)
            train_action.triggered.connect(lambda: self.set_as_training(week, col))
            menu.addAction(train_action)
        
        menu.exec_(table.viewport().mapToGlobal(pos))
    
    def set_as_rest(self, week, col):
        for i, d in enumerate(self.training_days):
            if d['week_number'] == week and d['day_of_week'] == col + 1:
                old_distance = d['distance']
                d['distance'] = 0
                d['pace_type'] = 'rest'
                
                reply = QMessageBox.question(
                    self, "重新平衡",
                    "是否要将减少的跑量分配到后续训练日？",
                    QMessageBox.Yes | QMessageBox.No
                )
                
                if reply == QMessageBox.Yes:
                    self.training_days = rebalance_plan(self.training_days, i, 0)
                
                self.modified = True
                break
        
        self.rebuild_week_data()
        self.load_plan_data()
    
    def set_as_training(self, week, col):
        for i, d in enumerate(self.training_days):
            if d['week_number'] == week and d['day_of_week'] == col + 1:
                easy_range = PACE_DISTANCE_RANGES['easy']
                d['distance'] = round((easy_range['min'] + easy_range['max']) / 2, 1)
                d['pace_type'] = 'easy'
                
                reply = QMessageBox.question(
                    self, "重新平衡",
                    "是否要将新增的跑量从后续训练日中扣减以保持平衡？",
                    QMessageBox.Yes | QMessageBox.No
                )
                
                if reply == QMessageBox.Yes:
                    self.training_days = rebalance_plan(self.training_days, i, d['distance'])
                
                self.modified = True
                break
        
        self.rebuild_week_data()
        self.load_plan_data()
    
    def rebuild_week_data(self):
        self.week_data = {}
        for day in self.training_days:
            week = day['week_number']
            day_idx = day['day_of_week'] - 1
            if week not in self.week_data:
                self.week_data[week] = {}
            self.week_data[week][day_idx] = day
    
    def save_changes(self):
        try:
            db.update_all_training_days(self.plan_id, self.training_days)
            self.modified = False
            QMessageBox.information(self, "成功", "计划修改已保存！")
        except Exception as e:
            QMessageBox.critical(self, "错误", f"保存失败: {str(e)}")
    
    def export_excel(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "导出为Excel",
            f"{self.plan['name']}.xlsx",
            "Excel文件 (*.xlsx)"
        )
        if file_path:
            try:
                export_to_excel(self.plan, self.training_days, file_path)
                QMessageBox.information(self, "成功", f"计划已导出到:\n{file_path}")
            except Exception as e:
                QMessageBox.critical(self, "错误", f"导出失败: {str(e)}")
    
    def export_pdf(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "导出为PDF",
            f"{self.plan['name']}.pdf",
            "PDF文件 (*.pdf)"
        )
        if file_path:
            try:
                export_to_pdf(self.plan, self.training_days, file_path)
                QMessageBox.information(self, "成功", f"计划已导出到:\n{file_path}")
            except Exception as e:
                QMessageBox.critical(self, "错误", f"导出失败: {str(e)}")
    
    def closeEvent(self, event):
        if self.modified:
            reply = QMessageBox.question(
                self, "未保存的更改",
                "您有未保存的更改，是否保存？",
                QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel
            )
            
            if reply == QMessageBox.Cancel:
                event.ignore()
                return
            elif reply == QMessageBox.Yes:
                self.save_changes()
        
        self.closed.emit(self)
        super().closeEvent(event)


class EditDayDialog(QDialog):
    def __init__(self, day, parent=None, max_hr=0):
        super().__init__(parent)
        self.day = day
        self.max_hr = max_hr
        
        self.setWindowTitle(f"编辑训练 - {day['date']}")
        self.setMinimumWidth(420)
        
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        info_text = (f"<b>日期:</b> {self.day['date']}<br>"
                    f"<b>当前距离:</b> {self.day['distance']} km<br>"
                    f"<b>当前配速:</b> {PACE_TYPES.get(self.day['pace_type'], self.day['pace_type'])}")
        
        if self.max_hr > 0:
            current_hr = calculate_hr_for_pace(self.day['pace_type'], self.max_hr)
            if current_hr and self.day['pace_type'] != 'rest':
                info_text += f"<br><b>❤️ 建议心率:</b> {current_hr['range']} bpm ({current_hr['zone_name']})"
        
        info_label = QLabel(info_text)
        info_label.setTextFormat(Qt.RichText)
        layout.addWidget(info_label)
        
        layout.addSpacing(10)
        
        pace_label = QLabel("配速类型:")
        layout.addWidget(pace_label)
        
        self.pace_combo = QComboBox()
        for key, value in PACE_TYPES.items():
            self.pace_combo.addItem(value, key)
        
        current_index = self.pace_combo.findData(self.day['pace_type'])
        if current_index >= 0:
            self.pace_combo.setCurrentIndex(current_index)
        self.pace_combo.currentIndexChanged.connect(self.on_pace_changed)
        layout.addWidget(self.pace_combo)
        
        layout.addSpacing(10)
        
        distance_label = QLabel("训练距离 (公里):")
        layout.addWidget(distance_label)
        
        self.distance_spin = QDoubleSpinBox()
        self.distance_spin.setDecimals(1)
        self.distance_spin.setSingleStep(0.5)
        self.distance_spin.setSuffix(" km")
        self.distance_spin.setValue(self.day['distance'])
        layout.addWidget(self.distance_spin)
        
        self.range_hint = QLabel("")
        self.range_hint.setStyleSheet("color: #666; font-style: italic;")
        layout.addWidget(self.range_hint)
        
        self.on_pace_changed()
        
        layout.addSpacing(10)
        
        notes_label = QLabel("备注:")
        layout.addWidget(notes_label)
        
        self.notes_edit = QTextEdit()
        self.notes_edit.setPlainText(self.day.get('notes', ''))
        self.notes_edit.setMaximumHeight(80)
        layout.addWidget(self.notes_edit)
        
        warning_label = QLabel("⚠️ 提示：选择「重新平衡」时，系统会自动调整后续训练日的跑量，")
        warning_label.setStyleSheet("color: #d35400;")
        layout.addWidget(warning_label)
        
        warning_label2 = QLabel("但会保持在各配速类型的合理范围内。")
        warning_label2.setStyleSheet("color: #d35400;")
        layout.addWidget(warning_label2)
        
        layout.addSpacing(10)
        
        button_layout = QHBoxLayout()
        
        ok_btn = QPushButton("确定")
        ok_btn.clicked.connect(self.accept)
        button_layout.addWidget(ok_btn)
        
        cancel_btn = QPushButton("取消")
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(cancel_btn)
        
        layout.addLayout(button_layout)
    
    def on_pace_changed(self):
        pace_type = self.pace_combo.currentData()
        ranges = PACE_DISTANCE_RANGES.get(pace_type, PACE_DISTANCE_RANGES['easy'])
        
        if pace_type == 'rest':
            self.distance_spin.setRange(0, 0)
            self.distance_spin.setValue(0)
            self.distance_spin.setEnabled(False)
            range_text = "📌 休息日：距离固定为 0 公里"
        else:
            min_dist = ranges['min']
            max_dist = ranges['max']
            self.distance_spin.setEnabled(True)
            self.distance_spin.setRange(min_dist, max_dist)
            
            current = self.distance_spin.value()
            if current < min_dist:
                self.distance_spin.setValue(min_dist)
            elif current > max_dist:
                self.distance_spin.setValue(max_dist)
            
            range_text = f"📌 距离范围：{min_dist} - {max_dist} 公里"
            
            if self.max_hr > 0:
                hr_info = calculate_hr_for_pace(pace_type, self.max_hr)
                if hr_info:
                    range_text += f" | ❤️ 心率：{hr_info['range']} bpm ({hr_info['zone_name']})"
        
        self.range_hint.setText(range_text)
    
    def get_distance(self):
        return self.distance_spin.value()
    
    def get_pace_type(self):
        return self.pace_combo.currentData()
    
    def get_notes(self):
        return self.notes_edit.toPlainText()
