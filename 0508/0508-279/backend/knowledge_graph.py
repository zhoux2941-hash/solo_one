from neo4j import GraphDatabase, Driver, Session
from typing import List, Dict, Optional
import uuid

class KnowledgeGraph:
    def __init__(self, uri: str = "bolt://localhost:7687", 
                 user: str = "neo4j", 
                 password: str = "password"):
        self.driver: Optional[Driver] = None
        self.uri = uri
        self.user = user
        self.password = password
        self._connect()
    
    def _connect(self):
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            self._create_constraints()
        except Exception as e:
            print(f"Neo4j Connection Error: {e}")
    
    def _create_constraints(self):
        constraints = [
            "CREATE CONSTRAINT person_name IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE",
            "CREATE CONSTRAINT location_name IF NOT EXISTS FOR (l:Location) REQUIRE l.name IS UNIQUE",
            "CREATE CONSTRAINT organization_name IF NOT EXISTS FOR (o:Organization) REQUIRE o.name IS UNIQUE",
            "CREATE CONSTRAINT event_name IF NOT EXISTS FOR (e:Event) REQUIRE e.name IS UNIQUE",
            "CREATE CONSTRAINT object_name IF NOT EXISTS FOR (obj:Object) REQUIRE obj.name IS UNIQUE",
            "CREATE CONSTRAINT image_id IF NOT EXISTS FOR (img:Image) REQUIRE img.image_id IS UNIQUE",
            "CREATE CONSTRAINT document_id IF NOT EXISTS FOR (doc:Document) REQUIRE doc.doc_id IS UNIQUE"
        ]
        
        with self.driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as e:
                    pass
    
    def close(self):
        if self.driver:
            self.driver.close()
    
    def _get_node_label(self, entity_type: str) -> str:
        type_map = {
            'PER': 'Person',
            'LOC': 'Location',
            'ORG': 'Organization',
            'EVENT': 'Event',
            'OBJECT': 'Object'
        }
        return type_map.get(entity_type, 'Entity')
    
    def add_entity(self, entity: Dict):
        label = self._get_node_label(entity['type'])
        
        query = f"""
        MERGE (n:{label} {{name: $name}})
        SET n.type = $type,
            n.label = $label,
            n.source = $source,
            n.confidence = $confidence,
            n.entity_id = $entity_id
        RETURN n
        """
        
        with self.driver.session() as session:
            result = session.run(query, 
                               name=entity['name'],
                               type=entity['type'],
                               label=entity.get('label', ''),
                               source=entity.get('source', ''),
                               confidence=entity.get('confidence', 1.0),
                               entity_id=str(uuid.uuid4()))
            return result.single()
    
    def add_relation(self, relation: Dict):
        source_label = self._get_node_label(relation['source_type'])
        target_label = self._get_node_label(relation['target_type'])
        
        rel_type = relation['relation'].upper().replace(' ', '_')
        
        query = f"""
        MATCH (a:{source_label} {{name: $source_name}})
        MATCH (b:{target_label} {{name: $target_name}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r.confidence = $confidence,
            r.relation_id = $relation_id
        RETURN r
        """
        
        with self.driver.session() as session:
            result = session.run(query,
                               source_name=relation['source'],
                               target_name=relation['target'],
                               confidence=relation.get('confidence', 1.0),
                               relation_id=str(uuid.uuid4()))
            return result.single()
    
    def add_image(self, image_data: Dict):
        query = """
        MERGE (img:Image {image_id: $image_id})
        SET img.image_path = $image_path,
            img.extracted_text = $extracted_text,
            img.thumbnail_path = $thumbnail_path
        RETURN img
        """
        
        with self.driver.session() as session:
            result = session.run(query,
                               image_id=image_data['image_id'],
                               image_path=image_data['image_path'],
                               extracted_text=image_data.get('extracted_text', ''),
                               thumbnail_path=image_data.get('thumbnail_path', ''))
            
            for entity in image_data.get('entities', []):
                self.add_entity(entity)
                rel_query = """
                MATCH (img:Image {image_id: $image_id})
                MATCH (e {name: $entity_name})
                MERGE (img)-[:CONTAINS_ENTITY]->(e)
                """
                session.run(rel_query,
                          image_id=image_data['image_id'],
                          entity_name=entity['name'])
            
            for obj in image_data.get('detected_objects', []):
                obj_query = """
                MERGE (obj:Object {name: $obj_name})
                SET obj.type = 'OBJECT',
                    obj.label = $obj_label,
                    obj.object_type = $obj_type
                WITH obj
                MATCH (img:Image {image_id: $image_id})
                MERGE (img)-[:DETECTED]->(obj)
                """
                session.run(obj_query,
                          obj_name=obj['label'],
                          obj_label=obj['label'],
                          obj_type=obj['type'],
                          image_id=image_data['image_id'])
            
            return result.single()
    
    def add_document(self, doc_data: Dict):
        query = """
        MERGE (doc:Document {doc_id: $doc_id})
        SET doc.content = $content,
            doc.source = $source
        RETURN doc
        """
        
        with self.driver.session() as session:
            result = session.run(query,
                               doc_id=doc_data['doc_id'],
                               content=doc_data.get('content', ''),
                               source=doc_data.get('source', ''))
            
            for entity in doc_data.get('entities', []):
                self.add_entity(entity)
                rel_query = """
                MATCH (doc:Document {doc_id: $doc_id})
                MATCH (e {name: $entity_name})
                MERGE (doc)-[:MENTIONS]->(e)
                """
                session.run(rel_query,
                          doc_id=doc_data['doc_id'],
                          entity_name=entity['name'])
            
            for relation in doc_data.get('relations', []):
                self.add_relation(relation)
            
            return result.single()
    
    def search_images_by_text(self, keyword: str) -> List[Dict]:
        query = """
        MATCH (img:Image)
        WHERE img.extracted_text CONTAINS $keyword
        RETURN img.image_id as image_id, 
               img.image_path as image_path, 
               img.extracted_text as text,
               img.thumbnail_path as thumbnail
        """
        
        with self.driver.session() as session:
            result = session.run(query, keyword=keyword)
            return [dict(record) for record in result]
    
    def search_images_by_object(self, object_name: str) -> List[Dict]:
        query = """
        MATCH (img:Image)-[:DETECTED]->(obj:Object {name: $object_name})
        RETURN img.image_id as image_id,
               img.image_path as image_path,
               img.thumbnail_path as thumbnail,
               obj.name as object_name
        """
        
        with self.driver.session() as session:
            result = session.run(query, object_name=object_name)
            return [dict(record) for record in result]
    
    def search_images_multimodal(self, text_keyword: str, object_name: str) -> List[Dict]:
        query = """
        MATCH (img:Image)-[:DETECTED]->(obj:Object {name: $object_name})
        WHERE img.extracted_text CONTAINS $text_keyword
        RETURN img.image_id as image_id,
               img.image_path as image_path,
               img.extracted_text as text,
               img.thumbnail_path as thumbnail,
               collect(DISTINCT obj.name) as objects
        """
        
        with self.driver.session() as session:
            result = session.run(query, 
                               text_keyword=text_keyword,
                               object_name=object_name)
            return [dict(record) for record in result]
    
    def get_all_entities(self) -> List[Dict]:
        query = """
        MATCH (n)
        WHERE n:Person OR n:Location OR n:Organization OR n:Event OR n:Object
        RETURN n.name as name, 
               labels(n)[0] as type,
               n.label as label
        """
        
        with self.driver.session() as session:
            result = session.run(query)
            return [dict(record) for record in result]
    
    def get_all_relations(self) -> List[Dict]:
        query = """
        MATCH (a)-[r]->(b)
        WHERE (a:Person OR a:Location OR a:Organization OR a:Event OR a:Object)
          AND (b:Person OR b:Location OR b:Organization OR b:Event OR b:Object)
        RETURN a.name as source,
               b.name as target,
               type(r) as relation,
               labels(a)[0] as source_type,
               labels(b)[0] as target_type
        """
        
        with self.driver.session() as session:
            result = session.run(query)
            return [dict(record) for record in result]
    
    def get_graph_data(self) -> Dict:
        entities = self.get_all_entities()
        relations = self.get_all_relations()
        
        nodes = []
        for entity in entities:
            type_colors = {
                'Person': '#ff7675',
                'Location': '#74b9ff',
                'Organization': '#55efc4',
                'Event': '#fdcb6e',
                'Object': '#a29bfe'
            }
            nodes.append({
                'id': entity['name'],
                'label': entity['name'],
                'group': entity['type'],
                'color': type_colors.get(entity['type'], '#b2bec3')
            })
        
        edges = []
        for relation in relations:
            edges.append({
                'from': relation['source'],
                'to': relation['target'],
                'label': relation['relation'],
                'arrows': 'to'
            })
        
        return {'nodes': nodes, 'edges': edges}
    
    def natural_language_query(self, query_text: str) -> Dict:
        results = {
            'images': [],
            'entities': [],
            'relations': [],
            'summary': ''
        }
        
        if '图片' in query_text and '包含' in query_text:
            text_match = None
            object_match = None
            
            if '文字' in query_text:
                for keyword in ['长城', '北京', '上海', '故宫', '天安门']:
                    if keyword in query_text:
                        text_match = keyword
                        break
            
            if '实体' in query_text or '游客' in query_text or '人物' in query_text:
                for obj in ['游客', '人物', '建筑', '树木']:
                    if obj in query_text:
                        object_match = obj
                        break
            
            if text_match and object_match:
                results['images'] = self.search_images_multimodal(text_match, object_match)
                results['summary'] = f"找到 {len(results['images'])} 张同时包含 '{text_match}' 文字和 '{object_match}' 实体的图片"
            elif text_match:
                results['images'] = self.search_images_by_text(text_match)
                results['summary'] = f"找到 {len(results['images'])} 张包含 '{text_match}' 文字的图片"
            elif object_match:
                results['images'] = self.search_images_by_object(object_match)
                results['summary'] = f"找到 {len(results['images'])} 张包含 '{object_match}' 实体的图片"
        
        elif '实体' in query_text or '节点' in query_text:
            results['entities'] = self.get_all_entities()
            results['summary'] = f"知识图谱中共有 {len(results['entities'])} 个实体"
        
        elif '关系' in query_text or '边' in query_text:
            results['relations'] = self.get_all_relations()
            results['summary'] = f"知识图谱中共有 {len(results['relations'])} 条关系"
        
        else:
            for keyword in ['长城', '北京', '上海', '故宫', '天安门']:
                if keyword in query_text:
                    results['images'] = self.search_images_by_text(keyword)
                    results['summary'] = f"找到与 '{keyword}' 相关的 {len(results['images'])} 张图片"
                    break
        
        return results
    
    def clear_database(self):
        query = """
        MATCH (n)
        DETACH DELETE n
        """
        with self.driver.session() as session:
            session.run(query)
