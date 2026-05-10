import sys
from PyQt5.QtWidgets import QApplication

from db import DatabaseManager
from utils import CSVManager, PaperRecommender, PDFLabelGenerator, PaperAgingSimulator
from ui import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    
    db_manager = DatabaseManager()
    csv_manager = CSVManager()
    recommender = PaperRecommender()
    pdf_generator = PDFLabelGenerator()
    aging_simulator = PaperAgingSimulator()
    
    window = MainWindow(db_manager, csv_manager, recommender, pdf_generator, aging_simulator)
    window.show()
    
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
