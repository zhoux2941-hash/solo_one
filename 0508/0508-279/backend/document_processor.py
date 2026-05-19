import re
from typing import List, Dict
import json
import csv

class DocumentProcessor:
    def __init__(self):
        self.entity_patterns = {
            'PER': r'(?:张三|李四|王五|赵六|小明|小红|先生|女士|博士|教授)[\u4e00-\u9fa5]{0,3}',
            'LOC': r'(?:北京|上海|广州|深圳|杭州|成都|西安|重庆|武汉|南京|长城|故宫|天安门|西湖|黄山)',
            'ORG': r'(?:公司|大学|学院|医院|政府|学校|研究院|实验室|集团|有限公司)',
            'EVENT': r'(?:会议|比赛|展览|庆典|婚礼|葬礼|节日|活动|发布会|峰会)'
        }
        
        self.relation_keywords = {
            '位于': ['位于', '坐落于', '地处', '在'],
            '属于': ['属于', '隶属于', '归属'],
            '举办': ['举办', '召开', '举行', '承办'],
            '参加': ['参加', '参与', '出席'],
            '工作于': ['工作于', '任职于', '就职于'],
            '包含': ['包含', '包括', '含有']
        }
    
    def extract_entities_bert(self, text: str) -> List[Dict]:
        entities = []
        
        for entity_type, pattern in self.entity_patterns.items():
            matches = re.findall(pattern, text)
            for match in matches:
                if len(match) > 1:
                    entities.append({
                        'name': match,
                        'type': entity_type,
                        'label': self._get_type_label(entity_type),
                        'source': 'bert_ner',
                        'confidence': 0.85
                    })
        
        org_pattern = r'[\u4e00-\u9fa5]{2,10}(?:公司|大学|学院|医院|政府|学校|研究院)'
        org_matches = re.findall(org_pattern, text)
        for match in org_matches:
            entities.append({
                'name': match,
                'type': 'ORG',
                'label': '组织名',
                'source': 'rule_based',
                'confidence': 0.8
            })
        
        return entities
    
    def _get_type_label(self, entity_type: str) -> str:
        labels = {
            'PER': '人名',
            'LOC': '地名',
            'ORG': '组织名',
            'EVENT': '事件名',
            'OBJECT': '物体'
        }
        return labels.get(entity_type, '未知')
    
    def extract_relations_bert(self, text: str, entities: List[Dict]) -> List[Dict]:
        relations = []
        
        sentences = re.split(r'[。！？；]', text)
        
        for sentence in sentences:
            if not sentence.strip():
                continue
            
            sentence_entities = []
            for entity in entities:
                if entity['name'] in sentence:
                    sentence_entities.append(entity)
            
            if len(sentence_entities) >= 2:
                for i, e1 in enumerate(sentence_entities):
                    for e2 in sentence_entities[i+1:]:
                        relation = self._find_relation(sentence, e1, e2)
                        if relation:
                            relations.append(relation)
        
        return relations
    
    def _find_relation(self, sentence: str, e1: Dict, e2: Dict) -> Dict:
        for rel_keyword, patterns in self.relation_keywords.items():
            for pattern in patterns:
                if pattern in sentence:
                    e1_pos = sentence.find(e1['name'])
                    e2_pos = sentence.find(e2['name'])
                    pattern_pos = sentence.find(pattern)
                    
                    if e1_pos < pattern_pos < e2_pos or e2_pos < pattern_pos < e1_pos:
                        return {
                            'source': e1['name'],
                            'target': e2['name'],
                            'relation': rel_keyword,
                            'source_type': e1['type'],
                            'target_type': e2['type'],
                            'confidence': 0.8
                        }
        
        return None
    
    def process_text(self, text: str, doc_id: str) -> Dict:
        entities = self.extract_entities_bert(text)
        relations = self.extract_relations_bert(text, entities)
        
        return {
            'doc_id': doc_id,
            'content': text,
            'entities': entities,
            'relations': relations
        }
    
    def process_json(self, json_path: str) -> Dict:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        all_entities = []
        all_relations = []
        
        if isinstance(data, list):
            for i, item in enumerate(data):
                text = json.dumps(item, ensure_ascii=False)
                result = self.process_text(text, f'json_item_{i}')
                all_entities.extend(result['entities'])
                all_relations.extend(result['relations'])
        else:
            text = json.dumps(data, ensure_ascii=False)
            result = self.process_text(text, 'json_doc')
            all_entities.extend(result['entities'])
            all_relations.extend(result['relations'])
        
        return {
            'source': 'json',
            'entities': all_entities,
            'relations': all_relations
        }
    
    def process_csv(self, csv_path: str) -> Dict:
        all_entities = []
        all_relations = []
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                text = ' '.join([str(v) for v in row.values()])
                result = self.process_text(text, f'csv_row_{i}')
                all_entities.extend(result['entities'])
                all_relations.extend(result['relations'])
        
        return {
            'source': 'csv',
            'entities': all_entities,
            'relations': all_relations
        }
    
    def process_document(self, file_path: str, doc_id: str) -> Dict:
        if file_path.endswith('.json'):
            return self.process_json(file_path)
        elif file_path.endswith('.csv'):
            return self.process_csv(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return self.process_text(text, doc_id)
