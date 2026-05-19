import os
import sys
from PIL import Image, ImageDraw, ImageFont

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from multimodal_retrieval import MultimodalRetriever

def create_test_data(retriever):
    print("\n" + "="*60)
    print("创建测试数据")
    print("="*60)
    
    test_images_dir = "../data/test_images"
    os.makedirs(test_images_dir, exist_ok=True)
    
    test_images = [
        {
            'filename': 'great_wall_1.jpg',
            'text': '长城 北京 历史 古迹',
            'metadata': {'scene': '长城', 'location': '北京', 'category': '历史古迹'}
        },
        {
            'filename': 'great_wall_2.jpg',
            'text': '万里长城 游客 旅游 风景',
            'metadata': {'scene': '长城', 'location': '北京', 'category': '旅游景点'}
        },
        {
            'filename': 'forbidden_city.jpg',
            'text': '故宫 紫禁城 北京 宫殿',
            'metadata': {'scene': '故宫', 'location': '北京', 'category': '历史建筑'}
        },
        {
            'filename': 'west_lake.jpg',
            'text': '西湖 杭州 风景 湖泊',
            'metadata': {'scene': '西湖', 'location': '杭州', 'category': '自然风景'}
        },
        {
            'filename': 'university.jpg',
            'text': '北京大学 清华 校园 学生',
            'metadata': {'scene': '大学校园', 'location': '北京', 'category': '教育机构'}
        }
    ]
    
    for img_info in test_images:
        img_path = os.path.join(test_images_dir, img_info['filename'])
        
        img = Image.new('RGB', (400, 300), color='#f0f0f0')
        draw = ImageDraw.Draw(img)
        
        draw.rectangle([(50, 50), (350, 250)], outline='#667eea', width=3)
        
        try:
            font = ImageFont.truetype("simhei.ttf", 18)
        except:
            font = None
            
        y_pos = 80
        for line in img_info['text'].split():
            if font:
                draw.text((70, y_pos), line, fill='#333', font=font)
            else:
                draw.text((70, y_pos), line, fill='#333')
            y_pos += 40
        
        img.save(img_path)
        print(f"✅ 创建图片: {img_info['filename']}")
        
        retriever.add_image(img_info['filename'], img_path, img_info['metadata'])
    
    test_texts = [
        {
            'id': 'text_001',
            'text': '长城是中国古代伟大的军事防御工程，世界文化遗产之一，每年吸引大量游客参观',
            'metadata': {'type': '历史介绍', 'topic': '长城'}
        },
        {
            'id': 'text_002',
            'text': '故宫又称紫禁城，是明清两代皇家宫殿，位于北京市中心，是中国古代宫廷建筑之精华',
            'metadata': {'type': '历史介绍', 'topic': '故宫'}
        },
        {
            'id': 'text_003',
            'text': '西湖位于浙江省杭州市西面，是中国大陆首批国家重点风景名胜区和中国十大风景名胜之一',
            'metadata': {'type': '旅游介绍', 'topic': '西湖'}
        }
    ]
    
    for text_info in test_texts:
        retriever.add_text(text_info['id'], text_info['text'], text_info['metadata'])
        print(f"✅ 添加文本: {text_info['id']}")
    
    return test_images_dir

def run_tests(retriever, test_images_dir):
    print("\n" + "="*60)
    print("测试 1: 以图搜图 - 搜索长城相关图片")
    print("="*60)
    
    query_path = os.path.join(test_images_dir, 'great_wall_1.jpg')
    results = retriever.search_similar_images(query_path, top_k=3)
    
    print(f"\n查询图片: great_wall_1.jpg")
    print(f"找到 {len(results)} 张相似图片:")
    for i, result in enumerate(results, 1):
        print(f"  {i}. {result['image_id']:20s} 相似度: {result['similarity_score']:.4f}")
    
    print("\n" + "="*60)
    print("测试 2: 以图搜文 - 搜索长城相关文档")
    print("="*60)
    
    results = retriever.search_texts_by_image(query_path, top_k=3)
    
    print(f"\n查询图片: great_wall_1.jpg")
    print(f"找到 {len(results)} 条相关文档:")
    for i, result in enumerate(results, 1):
        print(f"  {i}. {result['doc_id']:15s} 相似度: {result['similarity_score']:.4f}")
        print(f"     内容摘要: {result['text'][:50]}...")
    
    print("\n" + "="*60)
    print("测试 3: 以文搜图 - 用文字描述搜索图片")
    print("="*60)
    
    query_texts = ["长城 历史 古迹", "故宫 北京 宫殿", "西湖 杭州 风景"]
    
    for query_text in query_texts:
        results = retriever.text_to_image_search(query_text, top_k=2)
        print(f"\n查询: '{query_text}'")
        print(f"找到 {len(results)} 张相关图片:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['image_id']:20s} 匹配度: {result['similarity_score']:.4f}")
    
    print("\n" + "="*60)
    print("测试 4: 跨模态联合搜索 - 同时返回相似图片和相关文档")
    print("="*60)
    
    query_path = os.path.join(test_images_dir, 'great_wall_1.jpg')
    results = retriever.cross_modal_search(query_path, top_k_images=3, top_k_texts=3)
    
    print(f"\n查询图片: great_wall_1.jpg")
    print(f"找到 {len(results['similar_images'])} 张相似图片")
    print(f"找到 {len(results['related_documents'])} 条相关文档")
    
    print("\n" + "="*60)
    print("统计信息")
    print("="*60)
    
    stats = retriever.get_stats()
    print(f"索引图片数量: {stats['total_images']}")
    print(f"索引文本数量: {stats['total_texts']}")
    print(f"特征维度: {stats['feature_dimension']}")
    print(f"计算设备: {stats['device']}")
    
    print("\n" + "="*60)
    print("✅ 所有测试完成！")
    print("="*60)

if __name__ == "__main__":
    print("🚀 初始化跨模态检索系统...")
    retriever = MultimodalRetriever()
    
    test_images_dir = create_test_data(retriever)
    run_tests(retriever, test_images_dir)
