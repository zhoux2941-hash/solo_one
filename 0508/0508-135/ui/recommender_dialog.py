from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QComboBox, QDoubleSpinBox, QPushButton, QTableWidget,
    QTableWidgetItem, QHeaderView, QMessageBox, QCheckBox,
    QSpinBox, QDialogButtonBox, QGroupBox, QFormLayout
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QColor, QBrush


class RecommenderDialog(QDialog):
    FIBER_TYPES = ['楮皮', '三桠', '雁皮', '桑皮', '皮纸', '竹纸', '麻纸', '稻草纸', '混合纤维']

    def __init__(self, parent=None, db_manager=None, recommender=None):
        super().__init__(parent)
        self.db_manager = db_manager
        self.recommender = recommender
        self.setWindowTitle('修复纸推荐')
        self.setMinimumSize(800, 600)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        input_group = QGroupBox('原始纸张信息')
        input_layout = QFormLayout(input_group)

        book_layout = QHBoxLayout()
        self.book_title_edit = QLineEdit()
        self.book_title_edit.setPlaceholderText('古籍名称（可选，用于保存记录）')
        book_layout.addWidget(self.book_title_edit)
        input_layout.addRow('古籍名称:', book_layout)

        fiber_layout = QVBoxLayout()
        fiber_layout.addWidget(QLabel('纤维配比:'))
        
        fiber_table_layout = QHBoxLayout()
        self.fiber_table = QTableWidget(0, 3)
        self.fiber_table.setHorizontalHeaderLabels(['纤维类型', '百分比(%)', '删除'])
        self.fiber_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.fiber_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.fiber_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Fixed)
        self.fiber_table.setColumnWidth(2, 60)
        self.fiber_table.setMaximumHeight(120)
        fiber_table_layout.addWidget(self.fiber_table)
        
        add_fiber_btn = QPushButton('添加')
        add_fiber_btn.clicked.connect(self.add_fiber_row)
        fiber_table_layout.addWidget(add_fiber_btn)
        fiber_layout.addLayout(fiber_table_layout)
        
        input_layout.addRow(fiber_layout)

        thickness_layout = QHBoxLayout()
        self.thickness_spin = QDoubleSpinBox()
        self.thickness_spin.setRange(0, 1000)
        self.thickness_spin.setDecimals(2)
        self.thickness_spin.setSingleStep(1)
        self.thickness_spin.setValue(50)
        thickness_layout.addWidget(self.thickness_spin)
        thickness_layout.addWidget(QLabel('g/m²'))
        thickness_layout.addStretch()
        input_layout.addRow('厚度:', thickness_layout)

        ph_layout = QHBoxLayout()
        self.ph_check = QCheckBox('pH值:')
        self.ph_check.setChecked(False)
        ph_layout.addWidget(self.ph_check)
        self.ph_spin = QDoubleSpinBox()
        self.ph_spin.setRange(0, 14)
        self.ph_spin.setDecimals(2)
        self.ph_spin.setValue(7)
        self.ph_spin.setEnabled(False)
        self.ph_check.toggled.connect(self.ph_spin.setEnabled)
        ph_layout.addWidget(self.ph_spin)
        ph_layout.addStretch()
        input_layout.addRow(ph_layout)

        top_n_layout = QHBoxLayout()
        self.top_n_spin = QSpinBox()
        self.top_n_spin.setRange(1, 20)
        self.top_n_spin.setValue(10)
        top_n_layout.addWidget(self.top_n_spin)
        top_n_layout.addStretch()
        input_layout.addRow('推荐数量:', top_n_layout)

        layout.addWidget(input_group)

        action_btn_layout = QHBoxLayout()
        recommend_btn = QPushButton('开始推荐')
        recommend_btn.clicked.connect(self.do_recommend)
        action_btn_layout.addWidget(recommend_btn)
        layout.addLayout(action_btn_layout)

        result_group = QGroupBox('推荐结果')
        result_layout = QVBoxLayout(result_group)
        
        self.result_table = QTableWidget(0, 9)
        self.result_table.setHorizontalHeaderLabels([
            '排名', '纸张名称', '纤维配比', '厚度(g/m²)', 'pH值',
            '纤维相似度', '厚度相似度', '综合评分', '推荐依据'
        ])
        self.result_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.result_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.result_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.result_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.result_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeToContents)
        self.result_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeToContents)
        self.result_table.horizontalHeader().setSectionResizeMode(6, QHeaderView.ResizeToContents)
        self.result_table.horizontalHeader().setSectionResizeMode(7, QHeaderView.ResizeToContents)
        self.result_table.horizontalHeader().setSectionResizeMode(8, QHeaderView.ResizeToContents)
        self.result_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.result_table.setSelectionMode(QTableWidget.SingleSelection)
        result_layout.addWidget(self.result_table)
        
        layout.addWidget(result_group)

        btn_box = QDialogButtonBox()
        btn_box.addButton('保存记录并返回', QDialogButtonBox.AcceptRole)
        btn_box.addButton('取消', QDialogButtonBox.RejectRole)
        btn_box.accepted.connect(self.save_and_accept)
        btn_box.rejected.connect(self.reject)
        layout.addWidget(btn_box)

        self.add_fiber_row()
        self.recommendations = []

    def add_fiber_row(self, fiber_type='楮皮', percentage=100):
        row = self.fiber_table.rowCount()
        self.fiber_table.insertRow(row)

        type_combo = QComboBox()
        type_combo.addItems(self.FIBER_TYPES)
        if fiber_type in self.FIBER_TYPES:
            type_combo.setCurrentText(fiber_type)
        self.fiber_table.setCellWidget(row, 0, type_combo)

        pct_spin = QDoubleSpinBox()
        pct_spin.setRange(0, 100)
        pct_spin.setDecimals(2)
        pct_spin.setSingleStep(5)
        pct_spin.setValue(percentage)
        self.fiber_table.setCellWidget(row, 1, pct_spin)

        del_btn = QPushButton('删除')
        del_btn.clicked.connect(lambda: self.remove_fiber_row(row))
        self.fiber_table.setCellWidget(row, 2, del_btn)

    def remove_fiber_row(self, row):
        self.fiber_table.removeRow(row)

    def get_fiber_compositions(self):
        fibers = []
        for row in range(self.fiber_table.rowCount()):
            type_combo = self.fiber_table.cellWidget(row, 0)
            pct_spin = self.fiber_table.cellWidget(row, 1)
            
            if type_combo and pct_spin:
                fiber_type = type_combo.currentText()
                percentage = pct_spin.value()
                if percentage > 0:
                    fibers.append({
                        'fiber_type': fiber_type,
                        'percentage': percentage
                    })
        return fibers

    def do_recommend(self):
        if not self.db_manager or not self.recommender:
            QMessageBox.warning(self, '错误', '系统初始化异常')
            return

        fibers = self.get_fiber_compositions()
        if not fibers:
            QMessageBox.warning(self, '提示', '请至少添加一种纤维类型')
            return

        thickness = self.thickness_spin.value()
        if thickness <= 0:
            QMessageBox.warning(self, '提示', '厚度必须大于0')
            return

        ph_value = self.ph_spin.value() if self.ph_check.isChecked() else None
        top_n = self.top_n_spin.value()

        all_papers = self.db_manager.get_all_papers()
        if not all_papers:
            QMessageBox.information(self, '提示', '数据库中没有任何纸张数据')
            return

        self.recommendations = self.recommender.recommend_papers(
            all_papers, fibers, thickness, ph_value, top_n
        )

        if not self.recommendations:
            QMessageBox.information(
                self, '提示', 
                '数据库中没有匹配的纸张数据。\n\n建议：\n1. 先导入示例数据（sample_data.csv）\n2. 或手动添加一些纸张数据'
            )
            return

        self.result_table.setRowCount(0)
        
        fiber_count = sum(1 for r in self.recommendations if r.get('match_type') == 'fiber')
        thickness_only_count = len(self.recommendations) - fiber_count
        
        if thickness_only_count > 0:
            QMessageBox.information(
                self, '推荐说明',
                f'找到 {fiber_count} 款纤维类型相近的纸张\n'
                f'另有 {thickness_only_count} 款按厚度相似推荐（纤维类型不同）'
            )

        for idx, rec in enumerate(self.recommendations):
            row = self.result_table.rowCount()
            self.result_table.insertRow(row)

            paper = rec['paper']
            fiber_str = ', '.join(
                [f"{fc['fiber_type']}:{fc['percentage']}%" 
                 for fc in paper.get('fiber_compositions', [])]
            )

            match_type = rec.get('match_type', 'fiber')
            if match_type == 'thickness_only':
                match_text = '厚度匹配'
                bg_color = QBrush(QColor(255, 240, 220))
            else:
                match_text = '纤维+厚度'
                bg_color = QBrush(QColor(220, 255, 220))

            self.result_table.setItem(row, 0, QTableWidgetItem(str(idx + 1)))
            self.result_table.setItem(row, 1, QTableWidgetItem(paper['name']))
            self.result_table.setItem(row, 2, QTableWidgetItem(fiber_str))
            self.result_table.setItem(row, 3, QTableWidgetItem(f"{paper['thickness']:.2f}"))
            
            ph_str = f"{paper['ph_value']:.2f}" if paper.get('ph_value') else '-'
            self.result_table.setItem(row, 4, QTableWidgetItem(ph_str))
            
            self.result_table.setItem(row, 5, QTableWidgetItem(f"{rec['fiber_similarity']:.2%}"))
            self.result_table.setItem(row, 6, QTableWidgetItem(f"{rec['thickness_similarity']:.2%}"))
            self.result_table.setItem(row, 7, QTableWidgetItem(f"{rec['overall_score']:.2%}"))
            self.result_table.setItem(row, 8, QTableWidgetItem(match_text))

            for col in range(self.result_table.columnCount()):
                item = self.result_table.item(row, col)
                if item:
                    item.setTextAlignment(Qt.AlignCenter)
                    item.setBackground(bg_color)

    def save_and_accept(self):
        selected_rows = self.result_table.selectedItems()
        if not selected_rows:
            QMessageBox.warning(self, '提示', '请先选择推荐的纸张')
            return

        selected_row = self.result_table.row(selected_rows[0])
        if selected_row < 0 or selected_row >= len(self.recommendations):
            return

        rec = self.recommendations[selected_row]
        paper = rec['paper']

        book_title = self.book_title_edit.text().strip()
        if book_title:
            fiber_comps = self.get_fiber_compositions()
            original_fiber_types = ', '.join([fc['fiber_type'] for fc in fiber_comps])
            original_thickness = self.thickness_spin.value()
            original_ph = self.ph_spin.value() if self.ph_check.isChecked() else None

            self.db_manager.add_repair_record(
                book_title=book_title,
                original_fiber_types=original_fiber_types,
                original_thickness=original_thickness,
                original_ph=original_ph,
                paper_id=paper['id'],
                paper_name=paper['name'],
                notes=f"综合相似度: {rec['overall_score']:.2%}"
            )

        self.selected_paper = paper
        self.accept()
