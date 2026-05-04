from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pathlib import Path
import uuid
from typing import List, Optional
import aiofiles
import cv2
import numpy as np
import time

from ..database import get_session
from ..config import settings
from ..models.database import (
    FirearmSample, CartridgeImage, CartridgeFeatures, CartridgeComparison
)
from ..models.schemas import (
    FirearmSampleCreate, FirearmSampleResponse,
    CartridgeImageResponse, CartridgeFeaturesResponse,
    CartridgeComparisonResponse, ComparisonResponse,
    ComparisonResult, SampleListResponse, ImageListResponse,
    Region, Point2D
)
from ..services.cartridge_feature_extractor import CartridgeFeatureExtractor
from ..services.cartridge_comparator import CartridgeComparator

router = APIRouter(prefix="/api/cartridge", tags=["弹壳比对"])
feature_extractor = CartridgeFeatureExtractor()
comparator = CartridgeComparator()

@router.post("/samples", response_model=FirearmSampleResponse)
async def create_sample(
    sample_data: FirearmSampleCreate,
    session: AsyncSession = Depends(get_session)
):
    """创建新的枪支样本"""
    sample = FirearmSample(
        sample_name=sample_data.sample_name,
        firearm_type=sample_data.firearm_type,
        manufacturer=sample_data.manufacturer,
        model=sample_data.model,
        serial_number=sample_data.serial_number,
        caliber=sample_data.caliber,
        description=sample_data.description,
        case_number=sample_data.case_number
    )
    
    session.add(sample)
    await session.commit()
    await session.refresh(sample)
    
    return FirearmSampleResponse.from_orm(sample)

@router.get("/samples", response_model=SampleListResponse)
async def list_samples(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    """获取所有枪支样本列表"""
    result = await session.execute(
        select(FirearmSample)
        .offset(skip)
        .limit(limit)
        .order_by(FirearmSample.created_at.desc())
    )
    samples = result.scalars().all()
    
    count_result = await session.execute(select(FirearmSample))
    total = len(count_result.scalars().all())
    
    return SampleListResponse(
        total=total,
        samples=[FirearmSampleResponse.from_orm(s) for s in samples]
    )

@router.get("/samples/{sample_id}", response_model=FirearmSampleResponse)
async def get_sample(
    sample_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取单个枪支样本信息"""
    result = await session.execute(
        select(FirearmSample).where(FirearmSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")
    
    return FirearmSampleResponse.from_orm(sample)

@router.put("/samples/{sample_id}", response_model=FirearmSampleResponse)
async def update_sample(
    sample_id: int,
    sample_data: FirearmSampleCreate,
    session: AsyncSession = Depends(get_session)
):
    """更新枪支样本信息"""
    result = await session.execute(
        select(FirearmSample).where(FirearmSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")
    
    sample.sample_name = sample_data.sample_name
    sample.firearm_type = sample_data.firearm_type
    sample.manufacturer = sample_data.manufacturer
    sample.model = sample_data.model
    sample.serial_number = sample_data.serial_number
    sample.caliber = sample_data.caliber
    sample.description = sample_data.description
    sample.case_number = sample_data.case_number
    
    await session.commit()
    await session.refresh(sample)
    
    return FirearmSampleResponse.from_orm(sample)

@router.delete("/samples/{sample_id}")
async def delete_sample(
    sample_id: int,
    session: AsyncSession = Depends(get_session)
):
    """删除枪支样本"""
    result = await session.execute(
        select(FirearmSample).where(FirearmSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")
    
    img_result = await session.execute(
        select(CartridgeImage).where(CartridgeImage.sample_id == sample_id)
    )
    images = img_result.scalars().all()
    
    for img in images:
        try:
            Path(img.image_path).unlink(missing_ok=True)
            if img.thumbnail_path:
                Path(img.thumbnail_path).unlink(missing_ok=True)
        except Exception:
            pass
    
    await session.execute(
        delete(CartridgeComparison).where(CartridgeComparison.sample_id == sample_id)
    )
    await session.execute(
        delete(CartridgeImage).where(CartridgeImage.sample_id == sample_id)
    )
    await session.delete(sample)
    await session.commit()
    
    return {"message": "样本已删除", "sample_id": sample_id}

@router.post("/samples/{sample_id}/images", response_model=CartridgeImageResponse)
async def upload_sample_image(
    sample_id: int,
    file: UploadFile = File(...),
    image_type: str = Form("primer"),
    session: AsyncSession = Depends(get_session)
):
    """为枪支样本上传弹壳图像"""
    sample_result = await session.execute(
        select(FirearmSample).where(FirearmSample.id == sample_id)
    )
    sample = sample_result.scalar_one_or_none()
    
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图像格式。支持格式: {settings.ALLOWED_IMAGE_EXTENSIONS}"
        )
    
    file_id = str(uuid.uuid4())
    save_filename = f"{file_id}{file_ext}"
    save_path = settings.SAMPLES_DIR / save_filename
    
    file_data = await file.read()
    nparr = np.frombuffer(file_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="无法解码图像")
    
    cv2.imwrite(str(save_path), image)
    
    height, width = image.shape[:2]
    file_size = len(file_data)
    
    image_hash = feature_extractor.compute_image_hash(image)
    
    thumbnail = feature_extractor.create_thumbnail(image)
    thumbnail_filename = f"{file_id}_thumb{file_ext}"
    thumbnail_path = settings.SAMPLES_DIR / thumbnail_filename
    cv2.imwrite(str(thumbnail_path), thumbnail)
    
    try:
        features = feature_extractor.extract_all_features(image)
        
        primer_region = None
        if features.get("primer_region"):
            pr = features["primer_region"]
            primer_region = {
                "center": {"x": pr["center_x"], "y": pr["center_y"]},
                "radius": pr.get("radius"),
                "width": pr.get("width"),
                "height": pr.get("height")
            }
        
        ejector_region = None
        if features.get("ejector_region"):
            er = features["ejector_region"]
            ejector_region = {
                "center": {"x": er["center_x"], "y": er["center_y"]},
                "angle": er.get("angle"),
                "width": er.get("width"),
                "height": er.get("height")
            }
        
        firing_pin_region = None
        if features.get("firing_pin_region"):
            fpr = features["firing_pin_region"]
            firing_pin_region = {
                "center": {"x": fpr["center_x"], "y": fpr["center_y"]},
                "radius": fpr.get("radius"),
                "width": fpr.get("width"),
                "height": fpr.get("height")
            }
        
        db_image = CartridgeImage(
            sample_id=sample_id,
            image_path=str(save_path),
            thumbnail_path=str(thumbnail_path),
            image_type=image_type,
            image_hash=image_hash,
            width=width,
            height=height,
            file_size=file_size,
            primer_region=primer_region,
            ejector_mark_region=ejector_region,
            firing_pin_hole_region=firing_pin_region,
            has_features=True
        )
        
        session.add(db_image)
        await session.commit()
        await session.refresh(db_image)
        
        primer_desc_path = settings.FEATURES_DIR / f"{file_id}_primer.npy"
        firing_pin_desc_path = settings.FEATURES_DIR / f"{file_id}_firing_pin.npy"
        ejector_desc_path = settings.FEATURES_DIR / f"{file_id}_ejector.npy"
        extractor_desc_path = settings.FEATURES_DIR / f"{file_id}_extractor.npy"
        
        feature_extractor.save_descriptors(features["primer"]["descriptors"], str(primer_desc_path))
        feature_extractor.save_descriptors(features["firing_pin"]["descriptors"], str(firing_pin_desc_path))
        feature_extractor.save_descriptors(features["ejector"]["descriptors"], str(ejector_desc_path))
        feature_extractor.save_descriptors(features["extractor"]["descriptors"], str(extractor_desc_path))
        
        db_features = CartridgeFeatures(
            image_id=db_image.id,
            primer_descriptor_path=str(primer_desc_path),
            firing_pin_descriptor_path=str(firing_pin_desc_path),
            ejector_descriptor_path=str(ejector_desc_path),
            extractor_descriptor_path=str(extractor_desc_path),
            primer_keypoints_count=features["primer"]["keypoints_count"],
            firing_pin_keypoints_count=features["firing_pin"]["keypoints_count"],
            ejector_keypoints_count=features["ejector"]["keypoints_count"],
            extractor_keypoints_count=features["extractor"]["keypoints_count"],
            primer_center_x=features["primer"]["center_x"],
            primer_center_y=features["primer"]["center_y"],
            primer_radius=features["primer"]["radius"],
            firing_pin_center_x=features["firing_pin"].get("center_x"),
            firing_pin_center_y=features["firing_pin"].get("center_y"),
            firing_pin_radius=features["firing_pin"].get("radius"),
            ejector_center_x=features["ejector"].get("center_x"),
            ejector_center_y=features["ejector"].get("center_y"),
            ejector_angle=features["ejector"].get("angle")
        )
        
        session.add(db_features)
        await session.commit()
        
        return CartridgeImageResponse.from_orm(db_image)
        
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        if thumbnail_path.exists():
            thumbnail_path.unlink()
        raise HTTPException(status_code=500, detail=f"特征提取失败: {str(e)}")

@router.get("/samples/{sample_id}/images", response_model=ImageListResponse)
async def list_sample_images(
    sample_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取样本的所有图像"""
    result = await session.execute(
        select(CartridgeImage).where(CartridgeImage.sample_id == sample_id)
        .order_by(CartridgeImage.created_at.desc())
    )
    images = result.scalars().all()
    
    count_result = await session.execute(
        select(CartridgeImage).where(CartridgeImage.sample_id == sample_id)
    )
    total = len(count_result.scalars().all())
    
    return ImageListResponse(
        total=total,
        images=[CartridgeImageResponse.from_orm(img) for img in images]
    )

@router.post("/images/upload", response_model=CartridgeImageResponse)
async def upload_query_image(
    file: UploadFile = File(...),
    image_type: str = Form("primer"),
    session: AsyncSession = Depends(get_session)
):
    """上传查询图像（用于比对）"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图像格式。支持格式: {settings.ALLOWED_IMAGE_EXTENSIONS}"
        )
    
    file_id = str(uuid.uuid4())
    save_filename = f"{file_id}{file_ext}"
    save_path = settings.IMAGES_DIR / save_filename
    
    file_data = await file.read()
    nparr = np.frombuffer(file_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="无法解码图像")
    
    cv2.imwrite(str(save_path), image)
    
    height, width = image.shape[:2]
    file_size = len(file_data)
    
    image_hash = feature_extractor.compute_image_hash(image)
    
    thumbnail = feature_extractor.create_thumbnail(image)
    thumbnail_filename = f"{file_id}_thumb{file_ext}"
    thumbnail_path = settings.IMAGES_DIR / thumbnail_filename
    cv2.imwrite(str(thumbnail_path), thumbnail)
    
    try:
        features = feature_extractor.extract_all_features(image)
        
        primer_region = None
        if features.get("primer_region"):
            pr = features["primer_region"]
            primer_region = {
                "center": {"x": pr["center_x"], "y": pr["center_y"]},
                "radius": pr.get("radius"),
                "width": pr.get("width"),
                "height": pr.get("height")
            }
        
        ejector_region = None
        if features.get("ejector_region"):
            er = features["ejector_region"]
            ejector_region = {
                "center": {"x": er["center_x"], "y": er["center_y"]},
                "angle": er.get("angle"),
                "width": er.get("width"),
                "height": er.get("height")
            }
        
        firing_pin_region = None
        if features.get("firing_pin_region"):
            fpr = features["firing_pin_region"]
            firing_pin_region = {
                "center": {"x": fpr["center_x"], "y": fpr["center_y"]},
                "radius": fpr.get("radius"),
                "width": fpr.get("width"),
                "height": fpr.get("height")
            }
        
        db_image = CartridgeImage(
            sample_id=None,
            image_path=str(save_path),
            thumbnail_path=str(thumbnail_path),
            image_type=image_type,
            image_hash=image_hash,
            width=width,
            height=height,
            file_size=file_size,
            primer_region=primer_region,
            ejector_mark_region=ejector_region,
            firing_pin_hole_region=firing_pin_region,
            has_features=True
        )
        
        session.add(db_image)
        await session.commit()
        await session.refresh(db_image)
        
        primer_desc_path = settings.FEATURES_DIR / f"{file_id}_primer.npy"
        firing_pin_desc_path = settings.FEATURES_DIR / f"{file_id}_firing_pin.npy"
        ejector_desc_path = settings.FEATURES_DIR / f"{file_id}_ejector.npy"
        extractor_desc_path = settings.FEATURES_DIR / f"{file_id}_extractor.npy"
        
        feature_extractor.save_descriptors(features["primer"]["descriptors"], str(primer_desc_path))
        feature_extractor.save_descriptors(features["firing_pin"]["descriptors"], str(firing_pin_desc_path))
        feature_extractor.save_descriptors(features["ejector"]["descriptors"], str(ejector_desc_path))
        feature_extractor.save_descriptors(features["extractor"]["descriptors"], str(extractor_desc_path))
        
        db_features = CartridgeFeatures(
            image_id=db_image.id,
            primer_descriptor_path=str(primer_desc_path),
            firing_pin_descriptor_path=str(firing_pin_desc_path),
            ejector_descriptor_path=str(ejector_desc_path),
            extractor_descriptor_path=str(extractor_desc_path),
            primer_keypoints_count=features["primer"]["keypoints_count"],
            firing_pin_keypoints_count=features["firing_pin"]["keypoints_count"],
            ejector_keypoints_count=features["ejector"]["keypoints_count"],
            extractor_keypoints_count=features["extractor"]["keypoints_count"],
            primer_center_x=features["primer"]["center_x"],
            primer_center_y=features["primer"]["center_y"],
            primer_radius=features["primer"]["radius"],
            firing_pin_center_x=features["firing_pin"].get("center_x"),
            firing_pin_center_y=features["firing_pin"].get("center_y"),
            firing_pin_radius=features["firing_pin"].get("radius"),
            ejector_center_x=features["ejector"].get("center_x"),
            ejector_center_y=features["ejector"].get("center_y"),
            ejector_angle=features["ejector"].get("angle")
        )
        
        session.add(db_features)
        await session.commit()
        
        return CartridgeImageResponse.from_orm(db_image)
        
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        if thumbnail_path.exists():
            thumbnail_path.unlink()
        raise HTTPException(status_code=500, detail=f"特征提取失败: {str(e)}")

@router.get("/images/{image_id}")
async def get_image(
    image_id: int,
    thumbnail: bool = False,
    session: AsyncSession = Depends(get_session)
):
    """获取图像文件"""
    result = await session.execute(
        select(CartridgeImage).where(CartridgeImage.id == image_id)
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="图像不存在")
    
    if thumbnail and image.thumbnail_path:
        file_path = Path(image.thumbnail_path)
    else:
        file_path = Path(image.image_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="图像文件已被删除")
    
    return FileResponse(
        path=str(file_path),
        filename=f"image_{image_id}{file_path.suffix}",
        media_type="image/jpeg"
    )

@router.get("/images/{image_id}/features", response_model=CartridgeFeaturesResponse)
async def get_image_features(
    image_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取图像特征信息"""
    result = await session.execute(
        select(CartridgeFeatures).where(CartridgeFeatures.image_id == image_id)
    )
    features = result.scalar_one_or_none()
    
    if not features:
        raise HTTPException(status_code=404, detail="特征不存在")
    
    return CartridgeFeaturesResponse.from_orm(features)

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: int,
    session: AsyncSession = Depends(get_session)
):
    """删除图像"""
    result = await session.execute(
        select(CartridgeImage).where(CartridgeImage.id == image_id)
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="图像不存在")
    
    try:
        Path(image.image_path).unlink(missing_ok=True)
        if image.thumbnail_path:
            Path(image.thumbnail_path).unlink(missing_ok=True)
    except Exception:
        pass
    
    await session.execute(
        delete(CartridgeFeatures).where(CartridgeFeatures.image_id == image_id)
    )
    await session.execute(
        delete(CartridgeComparison).where(CartridgeComparison.query_image_id == image_id)
    )
    await session.delete(image)
    await session.commit()
    
    return {"message": "图像已删除", "image_id": image_id}

@router.post("/compare/{query_image_id}", response_model=ComparisonResponse)
async def compare_with_database(
    query_image_id: int,
    top_n: int = 5,
    sample_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session)
):
    """将查询图像与数据库中的样本进行比对"""
    start_time = time.time()
    
    query_result = await session.execute(
        select(CartridgeImage)
        .options(selectinload(CartridgeImage.features))
        .where(CartridgeImage.id == query_image_id)
    )
    query_image = query_result.scalar_one_or_none()
    
    if not query_image:
        raise HTTPException(status_code=404, detail="查询图像不存在")
    
    if not query_image.features:
        raise HTTPException(status_code=400, detail="查询图像未提取特征")
    
    query_features = {
        "primer": {
            "descriptors": feature_extractor.load_descriptors(query_image.features.primer_descriptor_path)
            if query_image.features.primer_descriptor_path else None,
            "keypoints_count": query_image.features.primer_keypoints_count,
            "keypoints": []
        },
        "firing_pin": {
            "descriptors": feature_extractor.load_descriptors(query_image.features.firing_pin_descriptor_path)
            if query_image.features.firing_pin_descriptor_path else None,
            "keypoints_count": query_image.features.firing_pin_keypoints_count,
            "keypoints": []
        },
        "ejector": {
            "descriptors": feature_extractor.load_descriptors(query_image.features.ejector_descriptor_path)
            if query_image.features.ejector_descriptor_path else None,
            "keypoints_count": query_image.features.ejector_keypoints_count,
            "keypoints": []
        },
        "extractor": {
            "descriptors": feature_extractor.load_descriptors(query_image.features.extractor_descriptor_path)
            if query_image.features.extractor_descriptor_path else None,
            "keypoints_count": query_image.features.extractor_keypoints_count,
            "keypoints": []
        }
    }
    
    if sample_id:
        sample_query = select(FirearmSample).where(FirearmSample.id == sample_id)
    else:
        sample_query = select(FirearmSample)
    
    samples_result = await session.execute(
        sample_query.options(selectinload(FirearmSample.images).selectinload(CartridgeImage.features))
    )
    samples = samples_result.scalars().unique().all()
    
    database_samples = []
    
    for sample in samples:
        for image in sample.images:
            if image.features:
                sample_features = {
                    "primer": {
                        "descriptors": feature_extractor.load_descriptors(image.features.primer_descriptor_path)
                        if image.features.primer_descriptor_path else None,
                        "keypoints_count": image.features.primer_keypoints_count,
                        "keypoints": []
                    },
                    "firing_pin": {
                        "descriptors": feature_extractor.load_descriptors(image.features.firing_pin_descriptor_path)
                        if image.features.firing_pin_descriptor_path else None,
                        "keypoints_count": image.features.firing_pin_keypoints_count,
                        "keypoints": []
                    },
                    "ejector": {
                        "descriptors": feature_extractor.load_descriptors(image.features.ejector_descriptor_path)
                        if image.features.ejector_descriptor_path else None,
                        "keypoints_count": image.features.ejector_keypoints_count,
                        "keypoints": []
                    },
                    "extractor": {
                        "descriptors": feature_extractor.load_descriptors(image.features.extractor_descriptor_path)
                        if image.features.extractor_descriptor_path else None,
                        "keypoints_count": image.features.extractor_keypoints_count,
                        "keypoints": []
                    }
                }
                
                database_samples.append({
                    "sample_id": sample.id,
                    "sample_name": sample.sample_name,
                    "image_id": image.id,
                    "features": sample_features
                })
    
    if not database_samples:
        raise HTTPException(status_code=400, detail="数据库中没有可用的样本")
    
    results = []
    
    for sample_data in database_samples:
        sample_features = sample_data["features"]
        comparison = comparator.compare_images(query_features, sample_features)
        
        comparison_record = CartridgeComparison(
            query_image_id=query_image_id,
            sample_id=sample_data["sample_id"],
            sample_image_id=sample_data["image_id"],
            overall_similarity=comparison["overall_similarity"],
            primer_similarity=comparison["primer_similarity"],
            ejector_similarity=comparison["ejector_similarity"],
            extractor_similarity=comparison["extractor_similarity"],
            firing_pin_similarity=comparison["firing_pin_similarity"],
            inlier_count=comparison["total_inlier_count"],
            outlier_count=0,
            matched_points=comparison["matched_points"][:100] if comparison["matched_points"] else None,
            homography_matrix=comparison.get("primer_homography"),
            comparison_status="completed"
        )
        
        session.add(comparison_record)
        
        results.append({
            "sample_id": sample_data["sample_id"],
            "sample_name": sample_data["sample_name"],
            "image_id": sample_data["image_id"],
            "overall_similarity": comparison["overall_similarity"],
            "primer_similarity": comparison["primer_similarity"],
            "firing_pin_similarity": comparison["firing_pin_similarity"],
            "ejector_similarity": comparison["ejector_similarity"],
            "extractor_similarity": comparison["extractor_similarity"],
            "inlier_count": comparison["total_inlier_count"],
            "matched_points": comparison["matched_points"][:50] if comparison["matched_points"] else [],
            "confidence": comparison["confidence"]
        })
    
    await session.commit()
    
    results.sort(key=lambda x: x["overall_similarity"], reverse=True)
    
    top_results = []
    for i, result in enumerate(results[:top_n]):
        top_results.append(ComparisonResult(
            comparison_id=0,
            sample_id=result["sample_id"],
            sample_name=result["sample_name"],
            overall_similarity=result["overall_similarity"],
            primer_similarity=result.get("primer_similarity"),
            ejector_similarity=result.get("ejector_similarity"),
            extractor_similarity=result.get("extractor_similarity"),
            inlier_count=result["inlier_count"],
            matched_points=result.get("matched_points"),
            rank=i + 1,
            confidence=result["confidence"]
        ))
    
    comparison_time = time.time() - start_time
    
    return ComparisonResponse(
        query_image_id=query_image_id,
        total_samples=len(database_samples),
        top_n=top_n,
        results=top_results,
        comparison_time=comparison_time
    )

@router.get("/comparisons/{comparison_id}", response_model=CartridgeComparisonResponse)
async def get_comparison(
    comparison_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取比对记录详情"""
    result = await session.execute(
        select(CartridgeComparison).where(CartridgeComparison.id == comparison_id)
    )
    comparison = result.scalar_one_or_none()
    
    if not comparison:
        raise HTTPException(status_code=404, detail="比对记录不存在")
    
    return CartridgeComparisonResponse.from_orm(comparison)

@router.post("/compare/direct")
async def compare_two_images(
    image1_id: int,
    image2_id: int,
    session: AsyncSession = Depends(get_session)
):
    """直接比对两张图像"""
    img1_result = await session.execute(
        select(CartridgeImage)
        .options(selectinload(CartridgeImage.features))
        .where(CartridgeImage.id == image1_id)
    )
    img1 = img1_result.scalar_one_or_none()
    
    img2_result = await session.execute(
        select(CartridgeImage)
        .options(selectinload(CartridgeImage.features))
        .where(CartridgeImage.id == image2_id)
    )
    img2 = img2_result.scalar_one_or_none()
    
    if not img1 or not img2:
        raise HTTPException(status_code=404, detail="图像不存在")
    
    if not img1.features or not img2.features:
        raise HTTPException(status_code=400, detail="图像未提取特征")
    
    features1 = {
        "primer": {
            "descriptors": feature_extractor.load_descriptors(img1.features.primer_descriptor_path),
            "keypoints_count": img1.features.primer_keypoints_count,
            "keypoints": []
        },
        "firing_pin": {
            "descriptors": feature_extractor.load_descriptors(img1.features.firing_pin_descriptor_path),
            "keypoints_count": img1.features.firing_pin_keypoints_count,
            "keypoints": []
        },
        "ejector": {
            "descriptors": feature_extractor.load_descriptors(img1.features.ejector_descriptor_path),
            "keypoints_count": img1.features.ejector_keypoints_count,
            "keypoints": []
        },
        "extractor": {
            "descriptors": feature_extractor.load_descriptors(img1.features.extractor_descriptor_path),
            "keypoints_count": img1.features.extractor_keypoints_count,
            "keypoints": []
        }
    }
    
    features2 = {
        "primer": {
            "descriptors": feature_extractor.load_descriptors(img2.features.primer_descriptor_path),
            "keypoints_count": img2.features.primer_keypoints_count,
            "keypoints": []
        },
        "firing_pin": {
            "descriptors": feature_extractor.load_descriptors(img2.features.firing_pin_descriptor_path),
            "keypoints_count": img2.features.firing_pin_keypoints_count,
            "keypoints": []
        },
        "ejector": {
            "descriptors": feature_extractor.load_descriptors(img2.features.ejector_descriptor_path),
            "keypoints_count": img2.features.ejector_keypoints_count,
            "keypoints": []
        },
        "extractor": {
            "descriptors": feature_extractor.load_descriptors(img2.features.extractor_descriptor_path),
            "keypoints_count": img2.features.extractor_keypoints_count,
            "keypoints": []
        }
    }
    
    comparison = comparator.compare_images(features1, features2)
    
    return {
        "image1_id": image1_id,
        "image2_id": image2_id,
        "comparison": comparison
    }
