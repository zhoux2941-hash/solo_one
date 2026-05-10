import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QIcon

from main_window import MainWindow

def main():
    app = QApplication(sys.argv)
    
    app.setApplicationName("跑步训练计划生成器")
    app.setApplicationVersion("1.0.0")
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
