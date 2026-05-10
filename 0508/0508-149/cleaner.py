from PyQt5.QtCore import QThread, pyqtSignal
from send2trash import send2trash
import os
import time


class FileCleaner(QThread):
    clean_progress = pyqtSignal(int, int, str)
    clean_completed = pyqtSignal(int, int)
    clean_error = pyqtSignal(str)

    def __init__(self, files_to_delete, db):
        super().__init__()
        self.files_to_delete = files_to_delete
        self.db = db
        self._is_running = True

    def run(self):
        success_count = 0
        fail_count = 0
        total = len(self.files_to_delete)
        last_update_time = time.time()

        try:
            for idx, filepath in enumerate(self.files_to_delete):
                if not self._is_running:
                    break

                current_time = time.time()
                if current_time - last_update_time > 0.3 or idx == total - 1:
                    self.clean_progress.emit(idx + 1, total, f"已处理 {idx + 1}/{total} 个文件")
                    last_update_time = current_time

                try:
                    if os.path.exists(filepath):
                        send2trash(filepath)
                        self.db.delete_file_record(filepath)
                        success_count += 1
                    else:
                        self.db.delete_file_record(filepath)
                        success_count += 1
                except Exception as e:
                    fail_count += 1
                    self.clean_error.emit(f"删除失败: {filepath} - {str(e)}")

            self.clean_completed.emit(success_count, fail_count)

        except Exception as e:
            self.clean_error.emit(f"清理错误: {str(e)}")

    def stop(self):
        self._is_running = False
