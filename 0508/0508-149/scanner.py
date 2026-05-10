import os
import hashlib
import time
from PyQt5.QtCore import QThread, pyqtSignal

from perceptual_hash import (
    is_image_file,
    calculate_dhash,
    hamming_distance,
    group_similar_images
)


class FileScanner(QThread):
    scan_progress = pyqtSignal(int, int, str)
    scan_completed = pyqtSignal(dict)
    scan_error = pyqtSignal(str)

    def __init__(self, folder_path, db):
        super().__init__()
        self.folder_path = folder_path
        self.db = db
        self._is_running = True
        self._is_paused = False

    def run(self):
        try:
            self.db.clear_all()

            self.scan_progress.emit(0, 0, "正在扫描文件夹...")

            batch = []
            batch_size = 500
            file_count = 0
            image_count = 0
            last_update_time = time.time()

            for root, dirs, files in os.walk(self.folder_path):
                if not self._is_running:
                    break

                while self._is_paused:
                    time.sleep(0.1)
                    if not self._is_running:
                        break

                for filename in files:
                    if not self._is_running:
                        break

                    filepath = os.path.join(root, filename)
                    try:
                        if os.path.isfile(filepath) and not os.path.islink(filepath):
                            stat = os.stat(filepath)
                            is_image = is_image_file(filepath)
                            batch.append({
                                'path': filepath,
                                'size': stat.st_size,
                                'created_time': stat.st_ctime,
                                'md5': None,
                                'dhash': None
                            })
                            file_count += 1
                            if is_image:
                                image_count += 1

                            if len(batch) >= batch_size:
                                self.db.batch_insert_files(batch)
                                batch = []

                                current_time = time.time()
                                if current_time - last_update_time > 0.3:
                                    self.scan_progress.emit(
                                        file_count, 0,
                                        f"已扫描文件: {file_count} 个 (图片: {image_count})"
                                    )
                                    last_update_time = current_time

                    except (OSError, PermissionError):
                        continue

            if batch:
                self.db.batch_insert_files(batch)

            if not self._is_running:
                return

            self.scan_progress.emit(file_count, file_count, "正在查找可能重复的文件...")

            potential_duplicates = self._get_potential_duplicates_from_db()
            total_potential = len(potential_duplicates)

            if total_potential > 0:
                self.scan_progress.emit(0, total_potential, f"正在计算MD5哈希...")

                processed = 0
                md5_batch = []
                last_update_time = time.time()

                for row in potential_duplicates:
                    if not self._is_running:
                        break

                    while self._is_paused:
                        time.sleep(0.1)
                        if not self._is_running:
                            break

                    filepath = row[0]
                    size = row[1]
                    created_time = row[2]

                    md5 = self._calculate_md5(filepath)
                    if md5:
                        md5_batch.append({
                            'path': filepath,
                            'size': size,
                            'created_time': created_time,
                            'md5': md5
                        })

                        processed += 1

                        if len(md5_batch) >= batch_size:
                            self.db.batch_insert_files(md5_batch)
                            md5_batch = []

                            current_time = time.time()
                            if current_time - last_update_time > 0.3:
                                self.scan_progress.emit(
                                    processed, total_potential,
                                    f"计算MD5: {processed}/{total_potential}"
                                )
                                last_update_time = current_time

                if md5_batch:
                    self.db.batch_insert_files(md5_batch)

            if not self._is_running:
                return

            if image_count > 0:
                all_images = self._get_all_images_from_db()
                total_images = len(all_images)

                if total_images > 0:
                    self.scan_progress.emit(0, total_images, f"正在计算图片感知哈希 ({total_images} 张)...")

                    processed = 0
                    dhash_batch = []
                    last_update_time = time.time()

                    for row in all_images:
                        if not self._is_running:
                            break

                        while self._is_paused:
                            time.sleep(0.1)
                            if not self._is_running:
                                break

                        filepath = row[0]
                        size = row[1]
                        created_time = row[2]

                        dhash = calculate_dhash(filepath)
                        if dhash:
                            dhash_batch.append({
                                'path': filepath,
                                'size': size,
                                'created_time': created_time,
                                'dhash': dhash
                            })

                        processed += 1

                        if len(dhash_batch) >= batch_size:
                            self.db.batch_insert_files(dhash_batch)
                            dhash_batch = []

                            current_time = time.time()
                            if current_time - last_update_time > 0.3:
                                self.scan_progress.emit(
                                    processed, total_images,
                                    f"计算感知哈希: {processed}/{total_images}"
                                )
                                last_update_time = current_time

                    if dhash_batch:
                        self.db.batch_insert_files(dhash_batch)

            if not self._is_running:
                return

            self.scan_progress.emit(100, 100, "正在分析结果...")

            md5_duplicates = self._get_md5_duplicates_from_db()
            similar_images = self._get_similar_images_from_db()

            self.scan_progress.emit(100, 100, "扫描完成！")

            result = {
                'md5_duplicates': md5_duplicates,
                'similar_images': similar_images
            }
            self.scan_completed.emit(result)

        except Exception as e:
            self.scan_error.emit(f"扫描错误: {str(e)}")

    def _get_potential_duplicates_from_db(self):
        cursor = self.db.connection.cursor()
        cursor.execute('''
            SELECT path, size, created_time FROM files f1
            INNER JOIN (
                SELECT size FROM files
                WHERE size > 0
                GROUP BY size
                HAVING COUNT(*) > 1
            ) f2 ON f1.size = f2.size
        ''')
        return cursor.fetchall()

    def _get_all_images_from_db(self):
        cursor = self.db.connection.cursor()
        cursor.execute('''
            SELECT path, size, created_time FROM files
            WHERE LOWER(path) LIKE '%.jpg'
               OR LOWER(path) LIKE '%.jpeg'
               OR LOWER(path) LIKE '%.png'
               OR LOWER(path) LIKE '%.gif'
               OR LOWER(path) LIKE '%.bmp'
               OR LOWER(path) LIKE '%.webp'
               OR LOWER(path) LIKE '%.tiff'
               OR LOWER(path) LIKE '%.tif'
        ''')
        return cursor.fetchall()

    def _get_md5_duplicates_from_db(self):
        cursor = self.db.connection.cursor()
        cursor.execute('''
            SELECT md5, path, size, created_time
            FROM files
            WHERE md5 IS NOT NULL
            AND md5 IN (
                SELECT md5 FROM files
                WHERE md5 IS NOT NULL
                GROUP BY md5
                HAVING COUNT(*) > 1
            )
            ORDER BY md5, created_time ASC
        ''')
        rows = cursor.fetchall()

        md5_map = {}
        for row in rows:
            md5, path, size, created_time = row
            if md5 not in md5_map:
                md5_map[md5] = []
            md5_map[md5].append({
                'path': path,
                'size': size,
                'created_time': created_time
            })

        duplicates = []
        for md5, files in md5_map.items():
            if len(files) > 1:
                duplicates.append({
                    'md5': md5,
                    'files': files,
                    'size': files[0]['size'],
                    'wasted_space': (len(files) - 1) * files[0]['size']
                })

        return duplicates

    def _get_similar_images_from_db(self):
        cursor = self.db.connection.cursor()
        cursor.execute('''
            SELECT path, size, created_time, dhash
            FROM files
            WHERE dhash IS NOT NULL
            ORDER BY dhash
        ''')
        rows = cursor.fetchall()

        images_with_hash = [(row[0], row[3], row[1], row[2]) for row in rows if row[3]]

        threshold = 10
        groups = []
        used_indices = set()

        for i, (path1, hash1, size1, ct1) in enumerate(images_with_hash):
            if i in used_indices:
                continue

            group = [(path1, hash1, size1, ct1)]
            used_indices.add(i)

            for j, (path2, hash2, size2, ct2) in enumerate(images_with_hash):
                if j in used_indices or j == i:
                    continue

                distance = hamming_distance(hash1, hash2)
                if distance <= threshold:
                    group.append((path2, hash2, size2, ct2))
                    used_indices.add(j)

            if len(group) > 1:
                group_sorted = sorted(group, key=lambda x: x[3])
                files_list = [{
                    'path': f[0],
                    'size': f[2],
                    'created_time': f[3],
                    'dhash': f[1]
                } for f in group_sorted]

                avg_distance = 0
                count = 0
                for i1, f1 in enumerate(group_sorted):
                    for i2, f2 in enumerate(group_sorted):
                        if i2 > i1:
                            avg_distance += hamming_distance(f1[1], f2[1])
                            count += 1
                avg_distance = avg_distance / count if count > 0 else 0

                groups.append({
                    'group_id': len(groups),
                    'files': files_list,
                    'size': files_list[0]['size'],
                    'wasted_space': (len(files_list) - 1) * files_list[0]['size'],
                    'avg_hamming_distance': avg_distance
                })

        return groups

    def _calculate_md5(self, filepath, block_size=65536):
        try:
            md5 = hashlib.md5()
            with open(filepath, 'rb') as f:
                for block in iter(lambda: f.read(block_size), b''):
                    md5.update(block)
            return md5.hexdigest()
        except (OSError, PermissionError):
            return None

    def stop(self):
        self._is_running = False

    def pause(self):
        self._is_paused = True

    def resume(self):
        self._is_paused = False
