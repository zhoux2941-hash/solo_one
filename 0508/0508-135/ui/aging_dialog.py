from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QComboBox,
    QSpinBox, QPushButton, QGroupBox, QFormLayout, QFrame,
    QTableWidget, QTableWidgetItem, QHeaderView, QSplitter,
    QSizePolicy
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QColor, QBrush, QFont


class AgingSimulatorDialog(QDialog):
    ENVIRONMENT_OPTIONS = [
        ('optimal', '理想环境 - 恒温恒湿、避光'),
        ('good', '良好环境 - 博物馆条件'),
        ('normal', '普通环境 - 图书馆条件'),
        ('poor', '恶劣环境 - 潮湿高温')
    ]

    def __init__(self, parent=None, paper=None, aging_simulator=None):
        super().__init__(parent)
        self.paper = paper
        self.aging_simulator = aging_simulator
        self.setWindowTitle('纸张老化模拟')
        self.setMinimumSize(900, 700)
        self.setup_ui()
        self.load_paper_data()

    def setup_ui(self):
        main_layout = QVBoxLayout(self)

        input_group = QGroupBox('模拟参数')
        input_layout = QFormLayout(input_group)

        paper_info_layout = QHBoxLayout()
        self.paper_name_label = QLabel('未选择纸张')
        self.paper_name_label.setStyleSheet('font-weight: bold; font-size: 14px;')
        paper_info_layout.addWidget(self.paper_name_label)
        paper_info_layout.addStretch()
        input_layout.addRow('当前纸张:', paper_info_layout)

        fiber_layout = QHBoxLayout()
        self.fiber_info_label = QLabel('-')
        fiber_layout.addWidget(self.fiber_info_label)
        fiber_layout.addStretch()
        input_layout.addRow('纤维类型:', fiber_layout)

        thickness_layout = QHBoxLayout()
        self.thickness_label = QLabel('-')
        thickness_layout.addWidget(self.thickness_label)
        thickness_layout.addStretch()
        input_layout.addRow('厚度:', thickness_layout)

        year_layout = QHBoxLayout()
        year_layout.addWidget(QLabel('制作年代:'))
        self.year_spin = QSpinBox()
        self.year_spin.setRange(0, 2026)
        self.year_spin.setValue(1800)
        self.year_spin.setSuffix(' 年')
        self.year_spin.setSpecialValueText('未知')
        year_layout.addWidget(self.year_spin)
        
        year_layout.addSpacing(20)
        year_layout.addWidget(QLabel('快速选择:'))
        self.quick_year_combo = QComboBox()
        self.quick_year_combo.addItem('自定义', None)
        self.quick_year_combo.addItem('现代 (1980至今)', 1980)
        self.quick_year_combo.addItem('民国 (1912-1949)', 1930)
        self.quick_year_combo.addItem('清代 (1644-1912)', 1800)
        self.quick_year_combo.addItem('明代 (1368-1644)', 1500)
        self.quick_year_combo.addItem('宋元 (960-1368)', 1200)
        self.quick_year_combo.addItem('唐代及以前 (618-960)', 800)
        self.quick_year_combo.currentIndexChanged.connect(self.on_quick_year_changed)
        year_layout.addWidget(self.quick_year_combo)
        year_layout.addStretch()
        input_layout.addRow(year_layout)

        env_layout = QHBoxLayout()
        env_layout.addWidget(QLabel('保存环境:'))
        self.env_combo = QComboBox()
        for key, desc in self.ENVIRONMENT_OPTIONS:
            self.env_combo.addItem(desc, key)
        self.env_combo.setCurrentIndex(2)
        env_layout.addWidget(self.env_combo)
        env_layout.addStretch()
        input_layout.addRow(env_layout)

        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        simulate_btn = QPushButton('开始模拟')
        simulate_btn.clicked.connect(self.run_simulation)
        btn_layout.addWidget(simulate_btn)
        close_btn = QPushButton('关闭')
        close_btn.clicked.connect(self.reject)
        btn_layout.addWidget(close_btn)
        input_layout.addRow(btn_layout)

        main_layout.addWidget(input_group)

        self.result_group = QGroupBox('模拟结果')
        result_layout = QVBoxLayout(self.result_group)

        self.result_splitter = QSplitter(Qt.Horizontal)

        left_panel = QFrame()
        left_layout = QVBoxLayout(left_panel)

        self.age_label = QLabel()
        self.age_label.setStyleSheet('font-size: 16px; font-weight: bold; padding: 5px;')
        left_layout.addWidget(self.age_label)

        fragility_group = QGroupBox('脆弱等级')
        fragility_layout = QVBoxLayout(fragility_group)
        self.fragility_label = QLabel()
        self.fragility_label.setAlignment(Qt.AlignCenter)
        self.fragility_label.setStyleSheet('font-size: 24px; font-weight: bold; padding: 10px;')
        fragility_layout.addWidget(self.fragility_label)
        self.fragility_desc_label = QLabel()
        self.fragility_desc_label.setAlignment(Qt.AlignCenter)
        self.fragility_desc_label.setWordWrap(True)
        fragility_layout.addWidget(self.fragility_desc_label)
        left_layout.addWidget(fragility_group)

        score_group = QGroupBox('保存状况评分')
        score_layout = QVBoxLayout(score_group)
        self.score_label = QLabel()
        self.score_label.setAlignment(Qt.AlignCenter)
        self.score_label.setStyleSheet('font-size: 28px; font-weight: bold;')
        score_layout.addWidget(self.score_label)
        
        self.score_bar_frame = QFrame()
        self.score_bar_frame.setMinimumHeight(30)
        self.score_bar_frame.setFrameShape(QFrame.StyledPanel)
        score_layout.addWidget(self.score_bar_frame)
        left_layout.addWidget(score_group)

        self.result_splitter.addWidget(left_panel)

        right_panel = QFrame()
        right_layout = QVBoxLayout(right_panel)

        details_group = QGroupBox('详细参数')
        details_layout = QFormLayout(details_group)
        
        self.base_durability_label = QLabel('-')
        details_layout.addRow('基础耐用性:', self.base_durability_label)
        
        self.half_life_label = QLabel('-')
        details_layout.addRow('预期半衰期:', self.half_life_label)
        
        self.remaining_label = QLabel('-')
        details_layout.addRow('剩余寿命估算:', self.remaining_label)
        
        self.env_label = QLabel('-')
        details_layout.addRow('环境系数:', self.env_label)
        
        self.thickness_factor_label = QLabel('-')
        details_layout.addRow('厚度因素:', self.thickness_factor_label)
        
        self.ph_factor_label = QLabel('-')
        details_layout.addRow('pH值因素:', self.ph_factor_label)
        
        self.degradation_label = QLabel('-')
        details_layout.addRow('老化速率:', self.degradation_label)
        
        right_layout.addWidget(details_group)

        prediction_group = QGroupBox('未来预测')
        prediction_layout = QVBoxLayout(prediction_group)
        
        self.prediction_table = QTableWidget(0, 4)
        self.prediction_table.setHorizontalHeaderLabels([
            '时间点', '年份', '预测评分', '预测等级'
        ])
        self.prediction_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.prediction_table.setMaximumHeight(120)
        prediction_layout.addWidget(self.prediction_table)
        
        right_layout.addWidget(prediction_group)

        urgency_group = QGroupBox('修复建议')
        urgency_layout = QVBoxLayout(urgency_group)
        
        self.urgency_label = QLabel()
        self.urgency_label.setStyleSheet('font-size: 16px; font-weight: bold;')
        urgency_layout.addWidget(self.urgency_label)
        
        self.recommendation_label = QLabel()
        self.recommendation_label.setWordWrap(True)
        urgency_layout.addWidget(self.recommendation_label)
        
        right_layout.addWidget(urgency_group)
        right_layout.addStretch()

        self.result_splitter.addWidget(right_panel)
        self.result_splitter.setSizes([400, 500])

        result_layout.addWidget(self.result_splitter)
        main_layout.addWidget(self.result_group)

        self.result_group.setVisible(False)

    def load_paper_data(self):
        if self.paper:
            self.paper_name_label.setText(self.paper.get('name', '未知纸张'))
            
            fibers = self.paper.get('fiber_compositions', [])
            fiber_str = ', '.join(
                [f"{fc['fiber_type']}:{fc['percentage']}%" for fc in fibers]
            )
            self.fiber_info_label.setText(fiber_str)
            
            thickness = self.paper.get('thickness', 0)
            ph = self.paper.get('ph_value')
            ph_str = f', pH: {ph}' if ph else ''
            self.thickness_label.setText(f'{thickness} g/m²{ph_str}')

    def on_quick_year_changed(self, index):
        year = self.quick_year_combo.itemData(index)
        if year is not None:
            self.year_spin.setValue(year)

    def run_simulation(self):
        if not self.paper or not self.aging_simulator:
            return

        manufacture_year = self.year_spin.value()
        if manufacture_year == 0:
            manufacture_year = None

        env_key = self.env_combo.currentData()

        result = self.aging_simulator.simulate_aging(
            fiber_compositions=self.paper.get('fiber_compositions', []),
            thickness=self.paper.get('thickness', 0),
            ph_value=self.paper.get('ph_value'),
            manufacture_year=manufacture_year,
            environment=env_key
        )

        self.display_results(result)

    def display_results(self, result):
        self.result_group.setVisible(True)

        years_old = result['years_old']
        if years_old > 0:
            age_text = f'纸张年龄: {years_old} 年'
            if result['manufacture_year']:
                age_text += f' (约{result["manufacture_year"]}年制作)'
        else:
            age_text = '纸张年龄: 未知 (假设为新纸)'
        self.age_label.setText(age_text)

        fragility = result['fragility_level']
        self.fragility_label.setText(f'{fragility["level"]}级 - {fragility["name"]}')
        self.fragility_label.setStyleSheet(
            f'font-size: 24px; font-weight: bold; padding: 10px; color: {fragility["color"]};'
        )
        self.fragility_desc_label.setText(fragility['description'])

        score = result['current_preservation_score']
        self.score_label.setText(f'{score:.1%}')
        self.score_label.setStyleSheet(
            f'font-size: 28px; font-weight: bold; color: {fragility["color"]};'
        )
        self.update_score_bar(score, fragility['color'])

        self.base_durability_label.setText(f'{result["base_durability"]:.2%}')
        self.half_life_label.setText(f'{result["base_half_life_years"]:.0f} 年')
        
        remaining = result['remaining_life_years']
        self.remaining_label.setText(f'{remaining:.0f} 年')
        self.remaining_label.setStyleSheet(
            'color: #E74C3C;' if remaining < 100 else ''
        )

        env = result['environment']
        self.env_label.setText(f'{env["factor"]:.0%} ({env["name"]})')
        self.thickness_factor_label.setText(f'{result["thickness_factor"]:.0%}')
        self.ph_factor_label.setText(f'{result["ph_factor"]:.0%}')
        self.degradation_label.setText(f'{result["degradation_rate"]:.4f}/年')

        self.update_prediction_table(result)

        urgency = self.aging_simulator.get_repair_urgency(score, fragility)
        self.urgency_label.setText(f'修复紧迫性: {urgency["urgency"]}')
        self.urgency_label.setStyleSheet(
            f'font-size: 16px; font-weight: bold; color: {urgency["color"]};'
        )
        self.recommendation_label.setText(urgency['recommendation'])

    def update_score_bar(self, score, color):
        percentage = int(score * 100)
        stylesheet = f'''
            QFrame {{
                background-color: #F0F0F0;
                border: 1px solid #999;
                border-radius: 5px;
            }}
            QFrame::item {{
                background-color: {color};
                border-radius: 4px;
            }}
        '''
        self.score_bar_frame.setStyleSheet(stylesheet)

    def update_prediction_table(self, result):
        self.prediction_table.setRowCount(0)

        predictions = [
            ('现在', 0, result['current_preservation_score'], result['fragility_level']),
            ('50年后', 50, 
             result['prediction_50_years']['predicted_score'],
             result['prediction_50_years']['predicted_fragility']),
            ('100年后', 100,
             result['prediction_100_years']['predicted_score'],
             result['prediction_100_years']['predicted_fragility'])
        ]

        for label, years, score, fragility in predictions:
            row = self.prediction_table.rowCount()
            self.prediction_table.insertRow(row)

            future_year = result['current_year'] + years if years > 0 else result['current_year']

            self.prediction_table.setItem(row, 0, QTableWidgetItem(label))
            self.prediction_table.setItem(row, 1, QTableWidgetItem(str(future_year)))
            self.prediction_table.setItem(row, 2, QTableWidgetItem(f'{score:.1%}'))
            self.prediction_table.setItem(row, 3, 
                QTableWidgetItem(f'{fragility["level"]}级 - {fragility["name"]}'))

            for col in range(self.prediction_table.columnCount()):
                item = self.prediction_table.item(row, col)
                if item:
                    item.setTextAlignment(Qt.AlignCenter)
                    item.setForeground(QBrush(QColor(fragility['color'])))
