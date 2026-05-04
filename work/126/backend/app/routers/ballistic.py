from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import json

from ..database import get_session
from ..models.database import BallisticAnalysis, BulletHole, PointCloudData
from ..models.schemas import (
    BallisticAnalysisCreate, 
    BallisticAnalysisResponse,
    AnalysisListResponse,
    BulletHoleResponse,
    Point3D,
    Vector3D,
    TrajectoryPoint,
    ProbabilityCone,
    WeaponParameters,
    EnvironmentParameters
)
from ..services.ballistic_calculator import (
    BallisticCalculator, 
    WeaponParams,
    AirDensityCalculator
)

router = APIRouter(prefix="/api/ballistic", tags=["弹道分析"])
calculator = BallisticCalculator()

@router.post("/analyze", response_model=BallisticAnalysisResponse)
async def create_ballistic_analysis(
    request: BallisticAnalysisCreate,
    session: AsyncSession = Depends(get_session)
):
    """创建弹道分析，根据弹孔点计算弹道轨迹和射手位置"""
    if len(request.bullet_holes) < 2:
        raise HTTPException(
            status_code=400, 
            detail="至少需要2个弹孔点才能进行弹道分析"
        )
    
    result = await session.execute(
        select(PointCloudData).where(PointCloudData.id == request.point_cloud_id)
    )
    pointcloud = result.scalar_one_or_none()
    
    if not pointcloud:
        raise HTTPException(status_code=404, detail="点云数据不存在")
    
    weapon_params = calculator.generate_default_params(request.weapon_params.weapon_type)
    
    if request.weapon_params.initial_velocity_min > 0:
        weapon_params.initial_velocity_min = request.weapon_params.initial_velocity_min
    if request.weapon_params.initial_velocity_max > 0:
        weapon_params.initial_velocity_max = request.weapon_params.initial_velocity_max
    if request.weapon_params.bullet_mass:
        weapon_params.bullet_mass = request.weapon_params.bullet_mass
    if request.weapon_params.drag_coefficient:
        weapon_params.drag_coefficient = request.weapon_params.drag_coefficient
    if request.weapon_params.bullet_diameter:
        weapon_params.bullet_diameter = request.weapon_params.bullet_diameter
    
    env_params = None
    air_density = AirDensityCalculator.STANDARD_AIR_DENSITY
    
    if request.environment_params:
        env_params = request.environment_params
        air_density = AirDensityCalculator.calculate_air_density(env_params)
    
    bullet_holes_data = []
    for hole in request.bullet_holes:
        hole_data = {
            'position': hole.position,
            'normal': hole.normal
        }
        bullet_holes_data.append(hole_data)
    
    analysis_result = calculator.analyze_shooter_position(
        bullet_holes_data, 
        weapon_params,
        env_params
    )
    
    db_analysis = BallisticAnalysis(
        point_cloud_id=request.point_cloud_id,
        case_number=request.case_number,
        weapon_type=request.weapon_params.weapon_type,
        initial_velocity_min=weapon_params.initial_velocity_min,
        initial_velocity_max=weapon_params.initial_velocity_max,
        bullet_mass=weapon_params.bullet_mass,
        drag_coefficient=weapon_params.drag_coefficient,
        bullet_diameter=weapon_params.bullet_diameter,
        temperature=env_params.temperature if env_params else 20.0,
        altitude=env_params.altitude if env_params else 0.0,
        humidity=env_params.humidity if env_params else 50.0,
        pressure=env_params.pressure if env_params and env_params.pressure else None,
        air_density=air_density,
        shooter_position=analysis_result['shooter_position'].model_dump() if analysis_result['shooter_position'] else None,
        trajectory_data=[tp.model_dump() for tp in analysis_result['trajectory_data']] if analysis_result['trajectory_data'] else None,
        probability_cone=analysis_result['probability_cone'].model_dump() if analysis_result['probability_cone'] else None,
        analysis_status='completed'
    )
    
    session.add(db_analysis)
    await session.commit()
    await session.refresh(db_analysis)
    
    for hole in request.bullet_holes:
        db_hole = BulletHole(
            analysis_id=db_analysis.id,
            position_x=hole.position.x,
            position_y=hole.position.y,
            position_z=hole.position.z,
            normal_x=hole.normal.x if hole.normal else None,
            normal_y=hole.normal.y if hole.normal else None,
            normal_z=hole.normal.z if hole.normal else None,
            hole_type=hole.hole_type,
            confidence=hole.confidence,
            is_manual=hole.is_manual
        )
        session.add(db_hole)
    
    await session.commit()
    
    return await _build_analysis_response(db_analysis.id, session)

@router.post("/calculate-air-density")
async def calculate_air_density_endpoint(
    env_params: EnvironmentParameters
):
    """
    计算空气密度
    用于前端预览环境参数对空气密度的影响
    """
    try:
        air_density = AirDensityCalculator.calculate_air_density(env_params)
        
        pressure = env_params.pressure
        if pressure is None:
            pressure = AirDensityCalculator.calculate_pressure_from_altitude(
                env_params.altitude,
                env_params.temperature
            )
        
        saturation_pressure = AirDensityCalculator.calculate_saturation_vapor_pressure(
            env_params.temperature
        )
        
        return {
            "air_density": air_density,
            "standard_air_density": AirDensityCalculator.STANDARD_AIR_DENSITY,
            "density_ratio": air_density / AirDensityCalculator.STANDARD_AIR_DENSITY,
            "calculated_pressure": pressure,
            "saturation_vapor_pressure": saturation_pressure,
            "temperature_k": env_params.temperature + 273.15
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{analysis_id}", response_model=BallisticAnalysisResponse)
async def get_analysis(
    analysis_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取弹道分析结果"""
    return await _build_analysis_response(analysis_id, session)

@router.get("/list", response_model=AnalysisListResponse)
async def list_analyses(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    """列出所有弹道分析"""
    result = await session.execute(
        select(BallisticAnalysis)
        .options(selectinload(BallisticAnalysis.bullet_holes))
        .offset(skip)
        .limit(limit)
        .order_by(BallisticAnalysis.created_at.desc())
    )
    analyses = result.scalars().all()
    
    return AnalysisListResponse(
        total=len(analyses),
        analyses=[_analysis_to_response(analysis) for analysis in analyses]
    )

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    session: AsyncSession = Depends(get_session)
):
    """删除弹道分析"""
    result = await session.execute(
        select(BallisticAnalysis).where(BallisticAnalysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="分析记录不存在")
    
    await session.delete(analysis)
    await session.commit()
    
    return {"message": "分析记录已删除", "analysis_id": analysis_id}

async def _build_analysis_response(analysis_id: int, session: AsyncSession) -> BallisticAnalysisResponse:
    """构建分析响应"""
    result = await session.execute(
        select(BallisticAnalysis)
        .options(selectinload(BallisticAnalysis.bullet_holes))
        .where(BallisticAnalysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="分析记录不存在")
    
    return _analysis_to_response(analysis)

def _analysis_to_response(analysis: BallisticAnalysis) -> BallisticAnalysisResponse:
    """将数据库模型转换为响应模型"""
    bullet_holes = []
    for hole in analysis.bullet_holes:
        bullet_holes.append(BulletHoleResponse(
            id=hole.id,
            analysis_id=hole.analysis_id,
            position=Point3D(x=hole.position_x, y=hole.position_y, z=hole.position_z),
            normal=Vector3D(x=hole.normal_x, y=hole.normal_y, z=hole.normal_z) if hole.normal_x else None,
            hole_type=hole.hole_type,
            confidence=hole.confidence,
            is_manual=hole.is_manual,
            created_at=hole.created_at
        ))
    
    trajectory_data = None
    if analysis.trajectory_data:
        trajectory_data = [
            TrajectoryPoint(
                position=Point3D(**tp['position']),
                velocity=tp['velocity'],
                time=tp['time']
            )
            for tp in analysis.trajectory_data
        ]
    
    probability_cone = None
    if analysis.probability_cone:
        cone_data = analysis.probability_cone
        probability_cone = ProbabilityCone(
            apex=Point3D(**cone_data['apex']),
            direction=Vector3D(**cone_data['direction']),
            angle=cone_data['angle'],
            height=cone_data['height'],
            confidence=cone_data['confidence']
        )
    
    return BallisticAnalysisResponse(
        id=analysis.id,
        point_cloud_id=analysis.point_cloud_id,
        case_number=analysis.case_number,
        created_at=analysis.created_at,
        weapon_type=analysis.weapon_type,
        shooter_position=Point3D(**analysis.shooter_position) if analysis.shooter_position else None,
        trajectory_data=trajectory_data,
        probability_cone=probability_cone,
        analysis_status=analysis.analysis_status,
        bullet_holes=bullet_holes
    )
