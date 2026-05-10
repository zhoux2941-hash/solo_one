from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QTableWidget, QTableWidgetItem, QHeaderView, QMessageBox,
    QFileDialog, QTabWidget, QLabel, QGroupBox, QSplitter
)
from PyQt5.QtCore import Qt


class MainWindow(QMainWindow):
    def __init__(self, db_manager, csv_manager, recommender, pdf_generator, aging_simulator):
        super().__init__()
        self.setWindowTitle('古籍修复纸张纤维配比管理工具')
        self.setMinimumSize(1000, 700)
        
        self.db_manager = db_manager
        self.csv_manager = csv_manager
        self.recommender = recommender
        self.pdf_generator = pdf_generator
        self.aging_simulator = aging_simulator
        
        self.setup_ui()
        self.load_papers()
        self.load_repair_records()

    def setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)

        toolbar_layout = QHBoxLayout()
        
        add_btn = QPushButton('添加纸张')
        add_btn.clicked.connect(self.add_paper)
        toolbar_layout.addWidget(add_btn)

        edit_btn = QPushButton('编辑纸张')
        edit_btn.clicked.connect(self.edit_paper)
        toolbar_layout.addWidget(edit_btn)

        delete_btn = QPushButton('删除纸张')
        delete_btn.clicked.connect(self.delete_paper)
        toolbar_layout.addWidget(delete_btn)

        toolbar_layout.addStretch()

        import_btn = QPushButton('导入CSV')
        import_btn.clicked.connect(self.import_csv)
        toolbar_layout.addWidget(import_btn)

        export_btn = QPushButton('导出CSV')
        export_btn.clicked.connect(self.export_csv)
        toolbar_layout.addWidget(export_btn)

        toolbar_layout.addStretch()

        recommend_btn = QPushButton('修复纸推荐')
        recommend_btn.clicked.connect(self.show_recommender)
        toolbar_layout.addWidget(recommend_btn)

        pdf_btn = QPushButton('生成PDF标签')
        pdf_btn.clicked.connect(self.generate_pdf)
        toolbar_layout.addWidget(pdf_btn)

        aging_btn = QPushButton('老化模拟')
        aging_btn.clicked.connect(self.show_aging_simulator)
        toolbar_layout.addWidget(aging_btn)

        layout.addLayout(toolbar_layout)

        self.tab_widget = QTabWidget()
        
        papers_tab = QWidget()
        papers_layout = QVBoxLayout(papers_tab)
        
        self.papers_table = QTableWidget(0, 6)
        self.papers_table.setHorizontalHeaderLabels([
            'ID', '名称', '纤维配比', '厚度(g/m²)', 'pH值', '更新时间'
        ])
        self.papers_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.papers_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.papers_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.papers_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.papers_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeToContents)
        self.papers_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeToContents)
        self.papers_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.papers_table.setSelectionMode(QTableWidget.SingleSelection)
        self.papers_table.doubleClicked.connect(self.edit_paper)
        papers_layout.addWidget(self.papers_table)
        
        self.tab_widget.addTab(papers_tab, '纸张库')

        records_tab = QWidget()
        records_layout = QVBoxLayout(records_tab)
        
        self.records_table = QTableWidget(0, 7)
        self.records_table.setHorizontalHeaderLabels([
            'ID', '古籍名称', '原始纤维类型', '原始厚度',
            '使用纸张', '修复日期', '备注'
        ])
        self.records_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.records_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.records_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.records_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.records_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.Stretch)
        self.records_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeToContents)
        self.records_table.horizontalHeader().setSectionResizeMode(6, QHeaderView.Stretch)
        self.records_table.setSelectionBehavior(QTableWidget.SelectRows)
        records_layout.addWidget(self.records_table)
        
        self.tab_widget.addTab(records_tab, '修复记录')
        
        layout.addWidget(self.tab_widget)

        self.tab_widget.setCurrentIndex(0)

    def load_papers(self):
        self.papers_table.setRowCount(0)
        papers = self.db_manager.get_all_papers()
        
        for paper in papers:
            row = self.papers_table.rowCount()
            self.papers_table.insertRow(row)
            
            fiber_str = ', '.join(
                [f"{fc['fiber_type']}:{fc['percentage']}%" 
                 for fc in paper.get('fiber_compositions', [])]
            )
            
            ph_str = f"{paper['ph_value']:.2f}" if paper.get('ph_value') is not None else '-'
            
            self.papers_table.setItem(row, 0, QTableWidgetItem(str(paper['id'])))
            self.papers_table.setItem(row, 1, QTableWidgetItem(paper['name']))
            self.papers_table.setItem(row, 2, QTableWidgetItem(fiber_str))
            self.papers_table.setItem(row, 3, QTableWidgetItem(f"{paper['thickness']:.2f}"))
            self.papers_table.setItem(row, 4, QTableWidgetItem(ph_str))
            self.papers_table.setItem(row, 5, QTableWidgetItem(paper['updated_at']))

            for col in range(self.papers_table.columnCount()):
                item = self.papers_table.item(row, col)
                if item:
                    item.setTextAlignment(Qt.AlignCenter)

    def load_repair_records(self):
        self.records_table.setRowCount(0)
        records = self.db_manager.get_all_repair_records()
        
        for record in records:
            row = self.records_table.rowCount()
            self.records_table.insertRow(row)
            
            thickness_str = f"{record['original_thickness']:.2f}" if record.get('original_thickness') else '-'
            
            self.records_table.setItem(row, 0, QTableWidgetItem(str(record['id'])))
            self.records_table.setItem(row, 1, QTableWidgetItem(record['book_title']))
            self.records_table.setItem(row, 2, QTableWidgetItem(record['original_fiber_types'] or '-'))
            self.records_table.setItem(row, 3, QTableWidgetItem(thickness_str))
            self.records_table.setItem(row, 4, QTableWidgetItem(record['paper_name'] or '-'))
            self.records_table.setItem(row, 5, QTableWidgetItem(record['repair_date']))
            self.records_table.setItem(row, 6, QTableWidgetItem(record['notes'] or '-'))

            for col in range(self.records_table.columnCount()):
                item = self.records_table.item(row, col)
                if item:
                    item.setTextAlignment(Qt.AlignCenter)

    def add_paper(self):
        from ui.paper_editor import PaperEditorDialog
        dialog = PaperEditorDialog(self)
        if dialog.exec_() == PaperEditorDialog.Accepted:
            data = dialog.result
            self.db_manager.add_paper(
                data['name'],
                data['fiber_compositions'],
                data['thickness'],
                data['ph_value']
            )
            self.load_papers()

    def edit_paper(self):
        selected_items = self.papers_table.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, '提示', '请先选择要编辑的纸张')
            return
        
        row = self.papers_table.row(selected_items[0])
        id_item = self.papers_table.item(row, 0)
        if not id_item:
            return
        
        paper_id = int(id_item.text())
        paper = self.db_manager.get_paper(paper_id)
        if not paper:
            return

        from ui.paper_editor import PaperEditorDialog
        dialog = PaperEditorDialog(self, paper)
        if dialog.exec_() == PaperEditorDialog.Accepted:
            data = dialog.result
            self.db_manager.update_paper(
                paper_id,
                data['name'],
                data['fiber_compositions'],
                data['thickness'],
                data['ph_value']
            )
            self.load_papers()

    def delete_paper(self):
        selected_items = self.papers_table.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, '提示', '请先选择要删除的纸张')
            return
        
        reply = QMessageBox.question(
            self, '确认删除',
            '确定要删除选中的纸张吗？',
            QMessageBox.Yes | QMessageBox.No
        )
        if reply != QMessageBox.Yes:
            return
        
        row = self.papers_table.row(selected_items[0])
        id_item = self.papers_table.item(row, 0)
        if not id_item:
            return
        
        paper_id = int(id_item.text())
        self.db_manager.delete_paper(paper_id)
        self.load_papers()

    def import_csv(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, '导入CSV', '', 'CSV文件 (*.csv);;所有文件 (*.*)'
        )
        if not file_path:
            return
        
        try:
            papers = self.csv_manager.import_papers(file_path)
            if not papers:
                QMessageBox.warning(self, '提示', 'CSV文件中没有有效的纸张数据')
                return
            
            for p in papers:
                self.db_manager.add_paper(
                    p['name'],
                    p['fiber_compositions'],
                    p['thickness'],
                    p['ph_value']
                )
            
            self.load_papers()
            QMessageBox.information(self, '成功', f'成功导入 {len(papers)} 条纸张数据')
        except Exception as e:
            QMessageBox.critical(self, '错误', f'导入失败: {str(e)}')

    def export_csv(self):
        papers = self.db_manager.get_all_papers()
        if not papers:
            QMessageBox.warning(self, '提示', '没有纸张数据可导出')
            return
        
        file_path, _ = QFileDialog.getSaveFileName(
            self, '导出CSV', 'papers.csv', 'CSV文件 (*.csv);;所有文件 (*.*)'
        )
        if not file_path:
            return
        
        try:
            self.csv_manager.export_papers(papers, file_path)
            QMessageBox.information(self, '成功', f'成功导出 {len(papers)} 条纸张数据')
        except Exception as e:
            QMessageBox.critical(self, '错误', f'导出失败: {str(e)}')

    def show_recommender(self):
        from ui.recommender_dialog import RecommenderDialog
        dialog = RecommenderDialog(self, self.db_manager, self.recommender)
        if dialog.exec_() == RecommenderDialog.Accepted:
            self.load_repair_records()

    def generate_pdf(self):
        all_papers = self.db_manager.get_all_papers()
        if not all_papers:
            QMessageBox.warning(self, '提示', '没有纸张数据可生成标签')
            return
        
        file_path, _ = QFileDialog.getSaveFileName(
            self, '生成PDF标签', 'paper_labels.pdf', 'PDF文件 (*.pdf);;所有文件 (*.*)'
        )
        if not file_path:
            return
        
        try:
            self.pdf_generator.generate_labels(all_papers, file_path)
            QMessageBox.information(self, '成功', f'PDF标签已生成到: {file_path}')
        except Exception as e:
            QMessageBox.critical(self, '错误', f'生成PDF失败: {str(e)}')

    def show_aging_simulator(self):
        selected_items = self.papers_table.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, '提示', '请先选择一张纸张进行老化模拟')
            return
        
        row = self.papers_table.row(selected_items[0])
        id_item = self.papers_table.item(row, 0)
        if not id_item:
            return
        
        paper_id = int(id_item.text())
        paper = self.db_manager.get_paper(paper_id)
        if not paper:
            return

        from ui.aging_dialog import AgingSimulatorDialog
        dialog = AgingSimulatorDialog(self, paper, self.aging_simulator)
        dialog.exec_()
