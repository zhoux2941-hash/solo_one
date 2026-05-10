import csv
from datetime import datetime


class CSVExporter:
    @staticmethod
    def export_md5_duplicates(duplicates, output_path):
        try:
            with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                fieldnames = [
                    'Group ID', 'MD5', 'File Path', 'Size (Bytes)', 'Size (MB)',
                    'Created Time', 'Keep', 'Wasted Space (Bytes)', 'Wasted Space (MB)'
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()

                for group_id, group in enumerate(duplicates, 1):
                    total_wasted = group['wasted_space']
                    wasted_mb = total_wasted / (1024 * 1024)

                    for idx, file_info in enumerate(group['files']):
                        keep = 'Yes' if idx == 0 else 'No'
                        size_mb = file_info['size'] / (1024 * 1024)
                        created_time = datetime.fromtimestamp(file_info['created_time']).strftime('%Y-%m-%d %H:%M:%S')

                        writer.writerow({
                            'Group ID': group_id,
                            'MD5': group['md5'],
                            'File Path': file_info['path'],
                            'Size (Bytes)': file_info['size'],
                            'Size (MB)': f'{size_mb:.2f}',
                            'Created Time': created_time,
                            'Keep': keep,
                            'Wasted Space (Bytes)': total_wasted if idx == 0 else '',
                            'Wasted Space (MB)': f'{wasted_mb:.2f}' if idx == 0 else ''
                        })

            return True, f"导出成功: {output_path}"
        except Exception as e:
            return False, f"导出失败: {str(e)}"

    @staticmethod
    def export_similar_images(similar_images, output_path):
        try:
            with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                fieldnames = [
                    'Group ID', 'dHash', 'File Path', 'Size (Bytes)', 'Size (MB)',
                    'Created Time', 'Keep', 'Avg Hamming Distance',
                    'Wasted Space (Bytes)', 'Wasted Space (MB)'
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()

                for group_id, group in enumerate(similar_images, 1):
                    total_wasted = group['wasted_space']
                    wasted_mb = total_wasted / (1024 * 1024)
                    avg_dist = group.get('avg_hamming_distance', 0)

                    for idx, file_info in enumerate(group['files']):
                        keep = 'Yes' if idx == 0 else 'No'
                        size_mb = file_info['size'] / (1024 * 1024)
                        created_time = datetime.fromtimestamp(file_info['created_time']).strftime('%Y-%m-%d %H:%M:%S')

                        writer.writerow({
                            'Group ID': group_id,
                            'dHash': file_info.get('dhash', ''),
                            'File Path': file_info['path'],
                            'Size (Bytes)': file_info['size'],
                            'Size (MB)': f'{size_mb:.2f}',
                            'Created Time': created_time,
                            'Keep': keep,
                            'Avg Hamming Distance': f'{avg_dist:.1f}' if idx == 0 else '',
                            'Wasted Space (Bytes)': total_wasted if idx == 0 else '',
                            'Wasted Space (MB)': f'{wasted_mb:.2f}' if idx == 0 else ''
                        })

            return True, f"导出成功: {output_path}"
        except Exception as e:
            return False, f"导出失败: {str(e)}"

    @staticmethod
    def export_summary(md5_duplicates, similar_images, output_path):
        try:
            md5_files = sum(len(g['files']) for g in md5_duplicates)
            md5_groups = len(md5_duplicates)
            md5_wasted = sum(g['wasted_space'] for g in md5_duplicates)

            sim_files = sum(len(g['files']) for g in similar_images)
            sim_groups = len(similar_images)
            sim_wasted = sum(g['wasted_space'] for g in similar_images)

            total_files = md5_files + sim_files
            total_groups = md5_groups + sim_groups
            total_wasted = md5_wasted + sim_wasted

            with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                fieldnames = ['Category', 'Metric', 'Value']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()
                writer.writerow({'Category': 'Export', 'Metric': 'Export Time', 'Value': datetime.now().strftime('%Y-%m-%d %H:%M:%S')})

                writer.writerow({})
                writer.writerow({'Category': 'MD5 精确重复', 'Metric': 'Groups', 'Value': md5_groups})
                writer.writerow({'Category': 'MD5 精确重复', 'Metric': 'Files', 'Value': md5_files})
                writer.writerow({'Category': 'MD5 精确重复', 'Metric': 'Wasted Space (Bytes)', 'Value': md5_wasted})
                writer.writerow({'Category': 'MD5 精确重复', 'Metric': 'Wasted Space (MB)', 'Value': f'{md5_wasted/(1024*1024):.2f}'})

                writer.writerow({})
                writer.writerow({'Category': '相似图片 (感知哈希)', 'Metric': 'Groups', 'Value': sim_groups})
                writer.writerow({'Category': '相似图片 (感知哈希)', 'Metric': 'Files', 'Value': sim_files})
                writer.writerow({'Category': '相似图片 (感知哈希)', 'Metric': 'Wasted Space (Bytes)', 'Value': sim_wasted})
                writer.writerow({'Category': '相似图片 (感知哈希)', 'Metric': 'Wasted Space (MB)', 'Value': f'{sim_wasted/(1024*1024):.2f}'})

                writer.writerow({})
                writer.writerow({'Category': '总计', 'Metric': 'Total Groups', 'Value': total_groups})
                writer.writerow({'Category': '总计', 'Metric': 'Total Files', 'Value': total_files})
                writer.writerow({'Category': '总计', 'Metric': 'Total Wasted (Bytes)', 'Value': total_wasted})
                writer.writerow({'Category': '总计', 'Metric': 'Total Wasted (MB)', 'Value': f'{total_wasted/(1024*1024):.2f}'})

            return True, f"导出成功: {output_path}"
        except Exception as e:
            return False, f"导出失败: {str(e)}"
