from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QComboBox, QDoubleSpinBox, QPushButton, QTableWidget,
    QTableWidgetItem, QHeaderView, QMessageBox, QCheckBox
)
from PyQt5.QtCore import Qt


class PaperEditorDialog(QDialog):
    FIBER_TYPES = ['楮皮', '三桠', '雁皮', '桑皮', '皮纸', '竹纸', '麻纸', '稻草纸', '混合纤维']

    def __init__(self, parent=None, paper=None):
        super().__init__(parent)
        self.paper = paper
        self.setWindowTitle('纸张信息编辑' if paper else '添加纸张')
        self.setMinimumSize(500, 500)
        self.setup_ui()
        self.load_paper_data()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        name_layout = QHBoxLayout()
        name_layout.addWidget(QLabel('纸张名称:'))
        self.name_edit = QLineEdit()
        name_layout.addWidget(self.name_edit, 1)
        layout.addLayout(name_layout)

        layout.addWidget(QLabel('纤维配比:'))
        self.fiber_table = QTableWidget(0, 3)
        self.fiber_table.setHorizontalHeaderLabels(['纤维类型', '百分比(%)', '删除'])
        self.fiber_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.fiber_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.fiber_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Fixed)
        self.fiber_table.setColumnWidth(2, 60)
        self.fiber_table.setMinimumHeight(180)
        layout.addWidget(self.fiber_table)

        fiber_btn_layout = QHBoxLayout()
        add_fiber_btn = QPushButton('添加纤维')
        add_fiber_btn.clicked.connect(self.add_fiber_row)
        fiber_btn_layout.addWidget(add_fiber_btn)
        fiber_btn_layout.addStretch()
        layout.addLayout(fiber_btn_layout)

        thickness_layout = QHBoxLayout()
        thickness_layout.addWidget(QLabel('厚度 (g/m²):'))
        self.thickness_spin = QDoubleSpinBox()
        self.thickness_spin.setRange(0, 1000)
        self.thickness_spin.setDecimals(2)
        self.thickness_spin.setSingleStep(1)
        thickness_layout.addWidget(self.thickness_spin)
        thickness_layout.addStretch()
        layout.addLayout(thickness_layout)

        ph_layout = QHBoxLayout()
        self.ph_check = QCheckBox('pH值:')
        self.ph_check.setChecked(False)
        ph_layout.addWidget(self.ph_check)
        self.ph_spin = QDoubleSpinBox()
        self.ph_spin.setRange(0, 14)
        self.ph_spin.setDecimals(2)
        self.ph_spin.setEnabled(False)
        self.ph_check.toggled.connect(self.ph_spin.setEnabled)
        ph_layout.addWidget(self.ph_spin)
        ph_layout.addStretch()
        layout.addLayout(ph_layout)

        layout.addStretch()

        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        save_btn = QPushButton('保存')
        save_btn.clicked.connect(self.save_paper)
        btn_layout.addWidget(save_btn)
        cancel_btn = QPushButton('取消')
        cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(cancel_btn)
        layout.addLayout(btn_layout)

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

    def load_paper_data(self):
        if self.paper:
            self.name_edit.setText(self.paper.get('name', ''))
            self.thickness_spin.setValue(self.paper.get('thickness', 0))
            
            ph_value = self.paper.get('ph_value')
            if ph_value is not None:
                self.ph_check.setChecked(True)
                self.ph_spin.setValue(ph_value)
            
            fibers = self.paper.get('fiber_compositions', [])
            if fibers:
                for fc in fibers:
                    self.add_fiber_row(fc['fiber_type'], fc['percentage'])
            else:
                self.add_fiber_row()
        else:
            self.add_fiber_row()

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

    def save_paper(self):
        name = self.name_edit.text().strip()
        if not name:
            QMessageBox.warning(self, '提示', '请输入纸张名称')
            return

        fibers = self.get_fiber_compositions()
        if not fibers:
            QMessageBox.warning(self, '提示', '请至少添加一种纤维配比')
            return

        total_pct = sum(fc['percentage'] for fc in fibers)
        if abs(total_pct - 100) > 0.01:
            reply = QMessageBox.question(
                self, '确认',
                f'纤维配比总和为 {total_pct:.2f}%，不是 100%，是否继续保存？',
                QMessageBox.Yes | QMessageBox.No
            )
            if reply != QMessageBox.Yes:
                return

        thickness = self.thickness_spin.value()
        if thickness <= 0:
            QMessageBox.warning(self, '提示', '厚度必须大于0')
            return

        ph_value = self.ph_spin.value() if self.ph_check.isChecked() else None

        self.result = {
            'name': name,
            'fiber_compositions': fibers,
            'thickness': thickness,
            'ph_value': ph_value
        }
        self.accept()
