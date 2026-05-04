from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
import json

from ..models.schemas import BallisticAnalysisResponse

class ReportGenerator:
    def __init__(self):
        pass
    
    def generate_pdf_report(self,
                             analysis: BallisticAnalysisResponse,
                             output_path: str,
                             include_point_cloud_info: bool = True,
                             include_trajectory: bool = True,
                             include_probability_cone: bool = True,
                             additional_notes: Optional[str] = None) -> str:
        """
        生成案件分析报告PDF
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1a1a5c')
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceBefore=20,
            spaceAfter=10,
            textColor=colors.HexColor('#2c3e50')
        )
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=11,
            spaceAfter=12,
            leading=16
        )
        
        story = []
        
        story.append(Paragraph("法庭弹道分析报告", title_style))
        story.append(Spacer(1, 20))
        
        case_info = [
            ['案件编号:', analysis.case_number or '未指定'],
            ['分析编号:', str(analysis.id)],
            ['生成日期:', datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')],
            ['分析状态:', self._get_status_text(analysis.analysis_status)]
        ]
        
        case_table = Table(case_info, colWidths=[2*inch, 4*inch])
        case_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(case_table)
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("一、弹孔信息", heading_style))
        
        if analysis.bullet_holes:
            hole_data = [['序号', '坐标 (X, Y, Z)', '类型', '置信度']]
            for i, hole in enumerate(analysis.bullet_holes, 1):
                hole_data.append([
                    str(i),
                    f"({hole.position.x:.3f}, {hole.position.y:.3f}, {hole.position.z:.3f})",
                    self._get_hole_type_text(hole.hole_type),
                    f"{hole.confidence:.2%}"
                ])
            
            hole_table = Table(hole_data, colWidths=[0.6*inch, 2.5*inch, 1.2*inch, 1.2*inch])
            hole_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ]))
            story.append(hole_table)
        else:
            story.append(Paragraph("未检测到弹孔信息", body_style))
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("二、武器参数", heading_style))
        weapon_info = [
            ['枪支类型:', analysis.weapon_type or '未指定'],
        ]
        weapon_table = Table(weapon_info, colWidths=[2*inch, 4*inch])
        weapon_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(weapon_table)
        story.append(Spacer(1, 15))
        
        if include_trajectory and analysis.trajectory_data:
            story.append(Paragraph("三、弹道分析结果", heading_style))
            
            if analysis.shooter_position:
                shooter_info = [
                    ['估计射手位置:', f"({analysis.shooter_position.x:.3f}, {analysis.shooter_position.y:.3f}, {analysis.shooter_position.z:.3f})"],
                ]
                shooter_table = Table(shooter_info, colWidths=[2*inch, 4*inch])
                shooter_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 11),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ]))
                story.append(shooter_table)
            
            story.append(Spacer(1, 10))
            story.append(Paragraph(f"弹道轨迹包含 {len(analysis.trajectory_data)} 个采样点", body_style))
        
        if include_probability_cone and analysis.probability_cone:
            story.append(Paragraph("四、射手位置概率区域", heading_style))
            
            cone_info = [
                ['锥形顶点:', f"({analysis.probability_cone.apex.x:.3f}, {analysis.probability_cone.apex.y:.3f}, {analysis.probability_cone.apex.z:.3f})"],
                ['锥形方向:', f"({analysis.probability_cone.direction.x:.3f}, {analysis.probability_cone.direction.y:.3f}, {analysis.probability_cone.direction.z:.3f})"],
                ['锥形角度:', f"{analysis.probability_cone.angle:.2f} 弧度"],
                ['锥形高度:', f"{analysis.probability_cone.height:.2f} 米"],
                ['置信度:', f"{analysis.probability_cone.confidence:.2%}"]
            ]
            cone_table = Table(cone_info, colWidths=[2*inch, 4*inch])
            cone_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            story.append(cone_table)
        
        if additional_notes:
            story.append(Paragraph("五、附加说明", heading_style))
            story.append(Paragraph(additional_notes, body_style))
        
        story.append(PageBreak())
        story.append(Paragraph("分析结论", heading_style))
        conclusion_text = self._generate_conclusion(analysis)
        story.append(Paragraph(conclusion_text, body_style))
        
        story.append(Spacer(1, 50))
        story.append(Paragraph("报告生成人: 法庭弹道分析系统", body_style))
        story.append(Paragraph(f"报告生成时间: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}", body_style))
        
        doc.build(story)
        
        return str(output_path)
    
    def _get_status_text(self, status: str) -> str:
        status_map = {
            'pending': '待分析',
            'processing': '处理中',
            'completed': '已完成',
            'failed': '分析失败'
        }
        return status_map.get(status, status)
    
    def _get_hole_type_text(self, hole_type: Optional[str]) -> str:
        type_map = {
            'entrance': '射入口',
            'exit': '射出口',
            'uncertain': '不确定',
            None: '未检测'
        }
        return type_map.get(hole_type, hole_type or '未知')
    
    def _generate_conclusion(self, analysis: BallisticAnalysisResponse) -> str:
        conclusions = []
        
        if len(analysis.bullet_holes) >= 2:
            conclusions.append(f"基于检测到的 {len(analysis.bullet_holes)} 个弹孔点，成功计算出弹道轨迹。")
            
            if analysis.shooter_position:
                conclusions.append(
                    f"根据弹道反向溯源分析，射手可能位于坐标 "
                    f"({analysis.shooter_position.x:.2f}, {analysis.shooter_position.y:.2f}, {analysis.shooter_position.z:.2f}) 附近区域。"
                )
            
            if analysis.probability_cone:
                conclusions.append(
                    f"射手位置概率区域已通过锥形概率云表示，置信度为 {analysis.probability_cone.confidence:.2%}。"
                )
        else:
            conclusions.append("弹孔数量不足，无法进行完整的弹道分析。建议标记至少2个弹孔点以获得更准确的分析结果。")
        
        return " ".join(conclusions)
