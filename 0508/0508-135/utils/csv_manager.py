import csv


class CSVManager:
    FIBER_TYPES = ['楮皮', '三桠', '雁皮', '桑皮', '皮纸', '竹纸', '麻纸', '稻草纸', '混合纤维']

    @staticmethod
    def export_papers(papers, file_path):
        fieldnames = ['名称', '纤维类型', '配比百分比', '厚度(g/m²)', 'pH值']
        
        with open(file_path, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow(fieldnames)
            
            for paper in papers:
                fiber_type_str = ''
                percentage_str = ''
                
                if paper.get('fiber_compositions'):
                    fibers = paper['fiber_compositions']
                    fiber_type_str = ';'.join([fc['fiber_type'] for fc in fibers])
                    percentage_str = ';'.join([str(fc['percentage']) for fc in fibers])
                
                ph_str = str(paper.get('ph_value')) if paper.get('ph_value') is not None else ''
                
                writer.writerow([
                    paper['name'],
                    fiber_type_str,
                    percentage_str,
                    paper['thickness'],
                    ph_str
                ])

    @staticmethod
    def import_papers(file_path):
        papers = []
        
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            next(reader, None)
            
            for row in reader:
                if len(row) < 4:
                    continue
                
                name = row[0].strip()
                fiber_types_str = row[1].strip()
                percentages_str = row[2].strip()
                thickness_str = row[3].strip()
                ph_str = row[4].strip() if len(row) > 4 else ''
                
                if not name or not thickness_str:
                    continue
                
                try:
                    thickness = float(thickness_str)
                except ValueError:
                    continue
                
                ph_value = None
                if ph_str:
                    try:
                        ph_value = float(ph_str)
                    except ValueError:
                        pass
                
                fiber_compositions = []
                if fiber_types_str and percentages_str:
                    fiber_types = [ft.strip() for ft in fiber_types_str.split(';') if ft.strip()]
                    percentages = []
                    
                    for p_str in percentages_str.split(';'):
                        p_str = p_str.strip()
                        if p_str:
                            try:
                                percentages.append(float(p_str))
                            except ValueError:
                                percentages.append(0.0)
                    
                    for i, ft in enumerate(fiber_types):
                        if i < len(percentages):
                            pct = percentages[i]
                        else:
                            pct = 0.0
                        
                        fiber_compositions.append({
                            'fiber_type': ft,
                            'percentage': pct
                        })
                
                papers.append({
                    'name': name,
                    'fiber_compositions': fiber_compositions,
                    'thickness': thickness,
                    'ph_value': ph_value
                })
        
        return papers
