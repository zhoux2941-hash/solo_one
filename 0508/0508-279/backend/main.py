from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import uuid

from image_processor import ImageProcessor
from document_processor import DocumentProcessor
from knowledge_graph import KnowledgeGraph
from multimodal_retrieval import MultimodalRetriever, ChineseClipRetriever

app = FastAPI(title="多模态知识图谱系统", version="2.0.0", 
              description="支持跨模态检索：以图搜图、以图搜文、以文搜图")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "../uploads"
THUMBNAIL_DIR = "../uploads/thumbnails"
DATA_DIR = "../data"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

print("🚀 初始化多模态知识图谱系统...")
image_processor = ImageProcessor()
document_processor = DocumentProcessor()
kg = KnowledgeGraph()

try:
    retriever = ChineseClipRetriever()
    print("✅ 使用中文CLIP模型")
except:
    try:
        retriever = MultimodalRetriever()
        print("✅ 使用英文CLIP模型")
    except Exception as e:
        print(f"⚠️  CLIP模型加载失败: {e}")
        retriever = None

class QueryRequest(BaseModel):
    query: str

class UploadResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class QueryResponse(BaseModel):
    success: bool
    data: dict
    message: str

class CrossModalRequest(BaseModel):
    top_k_images: int = 5
    top_k_texts: int = 5

@app.get("/")
async def root():
    return {"message": "多模态知识图谱系统 API", "version": "1.0.0"}

@app.post("/api/upload/image", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    try:
        file_ext = os.path.splitext(file.filename)[1]
        image_id = str(uuid.uuid4())
        filename = f"{image_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        thumbnail_filename = f"thumb_{image_id}.jpg"
        thumbnail_path = os.path.join(THUMBNAIL_DIR, thumbnail_filename)
        image_processor.create_thumbnail(file_path, thumbnail_path)
        
        image_data = image_processor.process_image(file_path, image_id)
        image_data['thumbnail_path'] = f"/uploads/thumbnails/{thumbnail_filename}"
        
        kg.add_image(image_data)
        
        if retriever:
            metadata = {
                'extracted_text': image_data.get('extracted_text', ''),
                'entities': [e.get('name', '') for e in image_data.get('entities', [])],
                'original_name': file.filename
            }
            retriever.add_image(image_id, file_path, metadata)
        
        return UploadResponse(
            success=True,
            message="图片上传并处理成功，已加入跨模态索引",
            data=image_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/document", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    try:
        doc_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        doc_data = document_processor.process_document(file_path, doc_id)
        kg.add_document(doc_data)
        
        if retriever:
            text_content = doc_data.get('content', '') or \
                          ' '.join([e.get('name', '') for e in doc_data.get('entities', [])])
            if text_content.strip():
                metadata = {
                    'entities': [e.get('name', '') for e in doc_data.get('entities', [])],
                    'original_name': file.filename
                }
                retriever.add_text(doc_id, text_content, metadata)
        
        return UploadResponse(
            success=True,
            message="文档上传并处理成功，已加入跨模态索引",
            data=doc_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query", response_model=QueryResponse)
async def query_knowledge_graph(request: QueryRequest):
    try:
        result = kg.natural_language_query(request.query)
        return QueryResponse(
            success=True,
            data=result,
            message=result.get('summary', '查询成功')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph")
async def get_graph():
    try:
        graph_data = kg.get_graph_data()
        return {
            "success": True,
            "data": graph_data,
            "message": "获取图谱数据成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entities")
async def get_entities():
    try:
        entities = kg.get_all_entities()
        return {
            "success": True,
            "data": entities,
            "message": f"获取到 {len(entities)} 个实体"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/relations")
async def get_relations():
    try:
        relations = kg.get_all_relations()
        return {
            "success": True,
            "data": relations,
            "message": f"获取到 {len(relations)} 条关系"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images")
async def get_all_images():
    try:
        query = """
        MATCH (img:Image)
        RETURN img.image_id as image_id,
               img.image_path as image_path,
               img.extracted_text as extracted_text,
               img.thumbnail_path as thumbnail_path
        """
        with kg.driver.session() as session:
            result = session.run(query)
            images = [dict(record) for record in result]
        
        return {
            "success": True,
            "data": images,
            "message": f"获取到 {len(images)} 张图片"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/clear")
async def clear_database():
    try:
        kg.clear_database()
        if retriever:
            retriever.clear_index()
        return {
            "success": True,
            "message": "数据库和索引已清空"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crossmodal/search")
async def cross_modal_search(
    file: UploadFile = File(...),
    top_k_images: int = Form(5),
    top_k_texts: int = Form(5)
):
    if not retriever:
        raise HTTPException(status_code=503, detail="跨模态检索模块未初始化，请检查CLIP模型")
    
    try:
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}.jpg")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        results = retriever.cross_modal_search(temp_path, top_k_images, top_k_texts)
        
        os.remove(temp_path)
        
        for img in results.get('similar_images', []):
            if 'image_path' in img:
                img_path = img['image_path']
                if img_path.startswith('../'):
                    img['image_path'] = img_path.replace('../', '/', 1)
                img_id = img.get('image_id', '')
                if img_id:
                    img['thumbnail_path'] = f"/uploads/thumbnails/thumb_{img_id}.jpg"
        
        return {
            "success": True,
            "data": results,
            "message": f"找到 {len(results.get('similar_images', []))} 张相似图片和 {len(results.get('related_documents', []))} 条相关文档"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/text2image/search")
async def text_to_image_search(request: QueryRequest, top_k: int = 5):
    if not retriever:
        raise HTTPException(status_code=503, detail="跨模态检索模块未初始化，请检查CLIP模型")
    
    try:
        results = retriever.text_to_image_search(request.query, top_k)
        
        for img in results:
            if 'image_path' in img:
                img_path = img['image_path']
                if img_path.startswith('../'):
                    img['image_path'] = img_path.replace('../', '/', 1)
                img_id = img.get('image_id', '')
                if img_id:
                    img['thumbnail_path'] = f"/uploads/thumbnails/thumb_{img_id}.jpg"
        
        return {
            "success": True,
            "data": {
                'similar_images': results,
                'query_text': request.query
            },
            "message": f"找到 {len(results)} 张与 '{request.query}' 相关的图片"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crossmodal/stats")
async def get_crossmodal_stats():
    if not retriever:
        return {
            "success": False,
            "message": "跨模态检索模块未初始化",
            "data": None
        }
    
    try:
        stats = retriever.get_stats()
        return {
            "success": True,
            "data": stats,
            "message": "获取跨模态检索统计信息成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
def shutdown_event():
    kg.close()
    if retriever:
        retriever._save_index()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
