import os
import sys
from PIL import Image, ImageDraw, ImageFont
import uuid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from image_processor import ImageProcessor
from knowledge_graph import KnowledgeGraph

def create_sample_images():
    sample_dir = "../data/images"
    os.makedirs(sample_dir, exist_ok=True)
    
    image_processor = ImageProcessor()
    kg = KnowledgeGraph()
    
    samples = [
        {
            'text': '长城 游客 北京 2024',
            'objects': ['游客', '建筑'],
            'filename': 'great_wall.jpg'
        },
        {
            'text': '故宫 天安门 北京',
            'objects': ['建筑'],
            'filename': 'forbidden_city.jpg'
        },
        {
            'text': '西湖 杭州 游客 风景',
            'objects': ['游客', '树木'],
            'filename': 'west_lake.jpg'
        },
        {
            'text': '长城 历史 文化',
            'objects': ['建筑'],
            'filename': 'great_wall_2.jpg'
        },
        {
            'text': '北京大学 清华 学生',
            'objects': ['人物', '建筑'],
            'filename': 'university.jpg'
        }
    ]
    
    created_images = []
    
    for sample in samples:
        img_path = os.path.join(sample_dir, sample['filename'])
        
        img = Image.new('RGB', (400, 300), color='#f0f0f0')
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("simhei.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        draw.rectangle([(50, 50), (350, 200)], outline='#667eea', width=3)
        draw.text((60, 60), sample['text'], fill='#333', font=font)
        
        if '游客' in sample['objects']:
            draw.ellipse([(100, 220), (140, 260)], fill='#ff7675')
            draw.ellipse([(200, 220), (240, 260)], fill='#ff7675')
        
        if '建筑' in sample['objects']:
            draw.rectangle([(280, 150), (340, 250)], fill='#74b9ff')
        
        if '树木' in sample['objects']:
            draw.ellipse([(50, 150), (100, 200)], fill='#55efc4')
        
        img.save(img_path)
        
        image_id = str(uuid.uuid4())
        
        thumbnail_path = f"../uploads/thumbnails/thumb_{image_id}.jpg"
        os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
        image_processor.create_thumbnail(img_path, thumbnail_path)
        
        image_data = image_processor.process_image(img_path, image_id)
        image_data['thumbnail_path'] = f"/uploads/thumbnails/thumb_{image_id}.jpg"
        
        kg.add_image(image_data)
        created_images.append(sample['filename'])
        print(f"✅ 创建并处理: {sample['filename']}")
    
    kg.close()
    print(f"\n🎉 共创建 {len(created_images)} 张示例图片")
    return created_images

def create_sample_document():
    doc_dir = "../data/documents"
    os.makedirs(doc_dir, exist_ok=True)
    
    doc_content = """
    张三在北京的北京大学工作。
    北京大学位于北京市海淀区颐和园路5号。
    李四参加了在北京举办的人工智能峰会。
    长城是中国著名的历史文化古迹，每年吸引大量游客前来参观。
    王五在腾讯公司工作，腾讯公司总部位于深圳。
    西湖是杭州最著名的旅游景点之一。
    """
    
    doc_path = os.path.join(doc_dir, "sample.txt")
    with open(doc_path, 'w', encoding='utf-8') as f:
        f.write(doc_content)
    
    print(f"✅ 创建示例文档: {doc_path}")
    return doc_path

if __name__ == "__main__":
    print("🚀 开始创建示例数据...\n")
    
    create_sample_images()
    print()
    create_sample_document()
    
    print("\n✅ 示例数据创建完成！")
    print("\n💡 接下来的步骤:")
    print("   1. 启动 Neo4j 数据库")
    print("   2. 运行: cd backend && pip install -r requirements.txt")
    print("   3. 运行: python main.py")
    print("   4. 打开浏览器访问: frontend/index.html")
