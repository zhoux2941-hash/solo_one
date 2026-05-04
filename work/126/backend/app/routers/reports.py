from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pathlib import Path
import uuid
from datetime import datetime

from ..database import get_session
from ..config import settings
from ..models.database import BallisticAnalysis, BulletHole, CaseReport
from ..models.schemas import (
    ReportGenerateRequest,
    ReportResponse,
    BallisticAnalysisResponse,
    BulletHoleResponse,
    Point3D,
    Vector3D,
    TrajectoryPoint,
    ProbabilityCone
)
from ..services.report_generator import ReportGenerator

router = APIRouter(prefix="/api/reports", tags=["报告生成"])
report_generator = ReportGenerator()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportGenerateRequest,
    session: AsyncSession = Depends(get_session)
):
    """生成案件分析报告"""
    result = await session.execute(
        select(BallisticAnalysis)
        .options(selectinload(BallisticAnalysis.bullet_holes))
        .where(BallisticAnalysis.id == request.analysis_id)
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="分析记录不存在")
    
    analysis_response = await _get_analysis_response(analysis)
    
    report_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_filename = f"ballistic_report_{analysis.id}_{timestamp}.pdf"
    report_path = settings.REPORTS_DIR / report_filename
    
    try:
        generated_path = report_generator.generate_pdf_report(
            analysis=analysis_response,
            output_path=str(report_path),
            include_point_cloud_info=request.include_point_cloud_info,
            include_trajectory=request.include_trajectory,
            include_probability_cone=request.include_probability_cone,
            additional_notes=request.additional_notes
        )
        
        db_report = CaseReport(
            analysis_id=analysis.id,
            report_path=generated_path,
            report_format="pdf"
        )
        
        session.add(db_report)
        await session.commit()
        await session.refresh(db_report)
        
        return ReportResponse(
            id=db_report.id,
            analysis_id=db_report.analysis_id,
            report_path=db_report.report_path,
            generated_at=db_report.generated_at,
            report_format=db_report.report_format
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"报告生成失败: {str(e)}")

@router.get("/{report_id}")
async def download_report(
    report_id: int,
    session: AsyncSession = Depends(get_session)
):
    """下载生成的报告"""
    result = await session.execute(
        select(CaseReport).where(CaseReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    
    file_path = Path(report.report_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="报告文件已被删除")
    
    return FileResponse(
        path=str(file_path),
        filename=f"ballistic_report_{report.analysis_id}.pdf",
        media_type="application/pdf"
    )

@router.get("/analysis/{analysis_id}", response_model=list[ReportResponse])
async def get_reports_for_analysis(
    analysis_id: int,
    session: AsyncSession = Depends(get_session)
):
    """获取指定分析的所有报告"""
    result = await session.execute(
        select(CaseReport)
        .where(CaseReport.analysis_id == analysis_id)
        .order_by(CaseReport.generated_at.desc())
    )
    reports = result.scalars().all()
    
    return [
        ReportResponse(
            id=report.id,
            analysis_id=report.analysis_id,
            report_path=report.report_path,
            generated_at=report.generated_at,
            report_format=report.report_format
        )
        for report in reports
    ]

@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    session: AsyncSession = Depends(get_session)
):
    """删除报告"""
    result = await session.execute(
        select(CaseReport).where(CaseReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    
    file_path = Path(report.report_path)
    if file_path.exists():
        file_path.unlink()
    
    await session.delete(report)
    await session.commit()
    
    return {"message": "报告已删除", "report_id": report_id}

async def _get_analysis_response(analysis: BallisticAnalysis) -> BallisticAnalysisResponse:
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
