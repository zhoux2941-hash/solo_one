import os
import numpy as np
from typing import List, Dict, Tuple, Optional
from PIL import Image
import torch
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel, BertTokenizer, BertModel
import faiss
import pickle
import json

class MultimodalRetriever:
    def __init__(self, 
                 clip_model_name: str = "openai/clip-vit-base-patch32",
                 feature_dim: int = 512,
                 index_path: str = "../data/faiss_index",
                 metadata_path: str = "../data/metadata.pkl"):
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.feature_dim = feature_dim
        self.index_path = index_path
        self.metadata_path = metadata_path
        
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
        
        print(f"🚀 加载CLIP模型: {clip_model_name} (设备: {self.device})")
        self.clip_model = CLIPModel.from_pretrained(clip_model_name).to(self.device)
        self.clip_processor = CLIPProcessor.from_pretrained(clip_model_name)
        
        self.image_index = None
        self.text_index = None
        self.image_metadata = {}
        self.text_metadata = {}
        
        self._load_or_create_index()
        
        print("✅ 跨模态检索模块初始化完成！")
    
    def _load_or_create_index(self):
        try:
            if os.path.exists(self.index_path + "_image.index"):
                self.image_index = faiss.read_index(self.index_path + "_image.index")
                print(f"📊 已加载图片索引，包含 {self.image_index.ntotal} 条记录")
            
            if os.path.exists(self.index_path + "_text.index"):
                self.text_index = faiss.read_index(self.index_path + "_text.index")
                print(f"📊 已加载文本索引，包含 {self.text_index.ntotal} 条记录")
            
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'rb') as f:
                    metadata = pickle.load(f)
                    self.image_metadata = metadata.get('image', {})
                    self.text_metadata = metadata.get('text', {})
        except Exception as e:
            print(f"⚠️  加载索引失败，创建新索引: {e}")
            self._create_new_index()
    
    def _create_new_index(self):
        self.image_index = faiss.IndexFlatIP(self.feature_dim)
        self.text_index = faiss.IndexFlatIP(self.feature_dim)
        self.image_metadata = {}
        self.text_metadata = {}
        self._save_index()
    
    def _save_index(self):
        try:
            if self.image_index and self.image_index.ntotal > 0:
                faiss.write_index(self.image_index, self.index_path + "_image.index")
            
            if self.text_index and self.text_index.ntotal > 0:
                faiss.write_index(self.text_index, self.index_path + "_text.index")
            
            metadata = {
                'image': self.image_metadata,
                'text': self.text_metadata
            }
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(metadata, f)
        except Exception as e:
            print(f"❌ 保存索引失败: {e}")
    
    def extract_image_feature(self, image_path: str) -> Optional[np.ndarray]:
        try:
            image = Image.open(image_path).convert("RGB")
            
            inputs = self.clip_processor(
                images=image,
                return_tensors="pt",
                padding=True
            ).to(self.device)
            
            with torch.no_grad():
                image_features = self.clip_model.get_image_features(**inputs)
                image_features = F.normalize(image_features, p=2, dim=1)
            
            return image_features.cpu().numpy().flatten()
        except Exception as e:
            print(f"❌ 提取图片特征失败: {e}")
            return None
    
    def extract_text_feature(self, text: str) -> Optional[np.ndarray]:
        try:
            inputs = self.clip_processor(
                text=text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=77
            ).to(self.device)
            
            with torch.no_grad():
                text_features = self.clip_model.get_text_features(**inputs)
                text_features = F.normalize(text_features, p=2, dim=1)
            
            return text_features.cpu().numpy().flatten()
        except Exception as e:
            print(f"❌ 提取文本特征失败: {e}")
            return None
    
    def add_image(self, image_id: str, image_path: str, metadata: Dict = None) -> bool:
        feature = self.extract_image_feature(image_path)
        if feature is None:
            return False
        
        feature = feature.reshape(1, -1).astype('float32')
        
        if self.image_index is None:
            self._create_new_index()
        
        idx = self.image_index.ntotal
        self.image_index.add(feature)
        
        self.image_metadata[idx] = {
            'image_id': image_id,
            'image_path': image_path,
            'metadata': metadata or {}
        }
        
        self._save_index()
        return True
    
    def add_text(self, doc_id: str, text: str, metadata: Dict = None) -> bool:
        feature = self.extract_text_feature(text)
        if feature is None:
            return False
        
        feature = feature.reshape(1, -1).astype('float32')
        
        if self.text_index is None:
            self._create_new_index()
        
        idx = self.text_index.ntotal
        self.text_index.add(feature)
        
        self.text_metadata[idx] = {
            'doc_id': doc_id,
            'text': text,
            'metadata': metadata or {}
        }
        
        self._save_index()
        return True
    
    def search_similar_images(self, 
                              query_image_path: str, 
                              top_k: int = 5) -> List[Dict]:
        if self.image_index is None or self.image_index.ntotal == 0:
            return []
        
        query_feature = self.extract_image_feature(query_image_path)
        if query_feature is None:
            return []
        
        query_feature = query_feature.reshape(1, -1).astype('float32')
        distances, indices = self.image_index.search(query_feature, min(top_k, self.image_index.ntotal))
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx in self.image_metadata:
                result = self.image_metadata[idx].copy()
                result['similarity_score'] = float(dist)
                results.append(result)
        
        return sorted(results, key=lambda x: x['similarity_score'], reverse=True)
    
    def search_images_by_text(self, 
                              query_text: str, 
                              top_k: int = 5) -> List[Dict]:
        if self.image_index is None or self.image_index.ntotal == 0:
            return []
        
        query_feature = self.extract_text_feature(query_text)
        if query_feature is None:
            return []
        
        query_feature = query_feature.reshape(1, -1).astype('float32')
        distances, indices = self.image_index.search(query_feature, min(top_k, self.image_index.ntotal))
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx in self.image_metadata:
                result = self.image_metadata[idx].copy()
                result['similarity_score'] = float(dist)
                results.append(result)
        
        return sorted(results, key=lambda x: x['similarity_score'], reverse=True)
    
    def search_texts_by_image(self, 
                              query_image_path: str, 
                              top_k: int = 5) -> List[Dict]:
        if self.text_index is None or self.text_index.ntotal == 0:
            return []
        
        query_feature = self.extract_image_feature(query_image_path)
        if query_feature is None:
            return []
        
        query_feature = query_feature.reshape(1, -1).astype('float32')
        distances, indices = self.text_index.search(query_feature, min(top_k, self.text_index.ntotal))
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx in self.text_metadata:
                result = self.text_metadata[idx].copy()
                result['similarity_score'] = float(dist)
                results.append(result)
        
        return sorted(results, key=lambda x: x['similarity_score'], reverse=True)
    
    def cross_modal_search(self, 
                           image_path: str, 
                           top_k_images: int = 5, 
                           top_k_texts: int = 5) -> Dict:
        similar_images = self.search_similar_images(image_path, top_k_images)
        related_texts = self.search_texts_by_image(image_path, top_k_texts)
        
        return {
            'similar_images': similar_images,
            'related_documents': related_texts,
            'query_image': image_path
        }
    
    def text_to_image_search(self, text: str, top_k: int = 5) -> List[Dict]:
        return self.search_images_by_text(text, top_k)
    
    def get_stats(self) -> Dict:
        return {
            'total_images': self.image_index.ntotal if self.image_index else 0,
            'total_texts': self.text_index.ntotal if self.text_index else 0,
            'feature_dimension': self.feature_dim,
            'device': self.device
        }
    
    def clear_index(self):
        self._create_new_index()
        print("🗑️  索引已清空")
    
    def remove_image(self, image_id: str) -> bool:
        for idx, meta in self.image_metadata.items():
            if meta.get('image_id') == image_id:
                del self.image_metadata[idx]
                self._save_index()
                return True
        return False
    
    def remove_text(self, doc_id: str) -> bool:
        for idx, meta in self.text_metadata.items():
            if meta.get('doc_id') == doc_id:
                del self.text_metadata[idx]
                self._save_index()
                return True
        return False


class ChineseClipRetriever(MultimodalRetriever):
    def __init__(self, 
                 clip_model_name: str = "OFA-Sys/chinese-clip-vit-base-patch16",
                 feature_dim: int = 512,
                 index_path: str = "../data/faiss_index",
                 metadata_path: str = "../data/metadata.pkl"):
        super().__init__(clip_model_name, feature_dim, index_path, metadata_path)
        print("🎯 使用中文CLIP模型，支持更好的中文语义匹配！")


def create_test_data(retriever: MultimodalRetriever):
    print("\n🧪 创建测试数据...")
    
    test_images = [
        ('img_001', '../data/images/great_wall.jpg', {'scene': '长城', 'location': '北京'}),
        ('img_002', '../data/images/forbidden_city.jpg', {'scene': '故宫', 'location': '北京'}),
        ('img_003', '../data/images/west_lake.jpg', {'scene': '西湖', 'location': '杭州'}),
    ]
    
    test_texts = [
        ('doc_001', '万里长城是中国古代的军事防御工程，是世界文化遗产之一。', {'type': '历史介绍'}),
        ('doc_002', '故宫又称紫禁城，是明清两代的皇家宫殿，位于北京中轴线中心。', {'type': '历史介绍'}),
        ('doc_003', '西湖是杭州著名的旅游景点，有"上有天堂，下有苏杭"的美誉。', {'type': '旅游介绍'}),
        ('doc_004', '北京大学是中国著名的高等学府，培养了众多优秀人才。', {'type': '教育介绍'}),
    ]
    
    image_count = 0
    for img_id, img_path, meta in test_images:
        if os.path.exists(img_path):
            if retriever.add_image(img_id, img_path, meta):
                image_count += 1
    
    text_count = 0
    for doc_id, text, meta in test_texts:
        if retriever.add_text(doc_id, text, meta):
            text_count += 1
    
    print(f"✅ 已添加 {image_count} 张图片和 {text_count} 条文本到索引")
    return image_count, text_count


if __name__ == "__main__":
    print("=" * 60)
    print("跨模态检索模块测试")
    print("=" * 60)
    
    retriever = ChineseClipRetriever()
    
    stats = retriever.get_stats()
    print(f"\n📊 当前索引状态:")
    print(f"   图片数量: {stats['total_images']}")
    print(f"   文本数量: {stats['total_texts']}")
    print(f"   特征维度: {stats['feature_dimension']}")
    print(f"   设备: {stats['device']}")
    
    print("\n" + "=" * 60)
