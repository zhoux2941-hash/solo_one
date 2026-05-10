import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def register_fonts():
    font_paths = [
        'C:/Windows/Fonts/simhei.ttf',
        'C:/Windows/Fonts/simsun.ttc',
        'C:/Windows/Fonts/msyh.ttf',
        '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
        '/System/Library/Fonts/PingFang.ttc',
    ]
    
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont('Chinese', font_path))
                return True
            except Exception:
                continue
    return False

class PDFReportGenerator:
    def __init__(self):
        self.font_registered = register_fonts()
        self.styles = getSampleStyleSheet()
        self._setup_styles()
    
    def _setup_styles(self):
        font_name = 'Chinese' if self.font_registered else 'Helvetica'
        
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Title'],
            fontName=font_name,
            fontSize=20,
            leading=24,
            alignment=1,
            spaceAfter=20
        )
        
        self.h2_style = ParagraphStyle(
            'CustomH2',
            parent=self.styles['Heading2'],
            fontName=font_name,
            fontSize=14,
            leading=18,
            spaceBefore=12,
            spaceAfter=8
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontName=font_name,
            fontSize=10,
            leading=14
        )
        
        self.bold_style = ParagraphStyle(
            'CustomBold',
            parent=self.styles['Normal'],
            fontName=font_name,
            fontSize=10,
            leading=14,
            fontNameBold=font_name if self.font_registered else 'Helvetica-Bold'
        )
    
    def _safe_text(self, text):
        if text is None:
            return ''
        return str(text)
    
    def _add_image(self, path, width=8*cm, height=6*cm):
        if not path or not os.path.exists(path):
            return None
        try:
            img = Image(path, width=width, height=height)
            return img
        except Exception:
            return None
    
    def generate_report(self, sword, records, risk_info, maintenance_info, output_path):
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        story = []
        
        story.append(Paragraph('收藏级刀剑保养报告', self.title_style))
        story.append(Paragraph(f'生成日期：{datetime.now().strftime("%Y-%m-%d")}', self.normal_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph('一、藏品基本信息', self.h2_style))
        
        sword_data = [
            ['藏品名称', self._safe_text(sword.get('name'))],
            ['材质', self._safe_text(sword.get('material'))],
            ['刃长', f"{self._safe_text(sword.get('blade_length'))} cm" if sword.get('blade_length') else '未记录'],
            ['制作年代', self._safe_text(sword.get('production_year')) or '未记录'],
            ['当前状态', self._safe_text(sword.get('current_status'))],
        ]
        
        sword_table = Table(sword_data, colWidths=[4*cm, 10*cm])
        sword_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(sword_table)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph('二、锈蚀风险评估', self.h2_style))
        
        risk_level_color = {
            '低': colors.green,
            '中': colors.orange,
            '高': colors.red
        }.get(risk_info.get('risk_level', '低'), colors.grey)
        
        risk_data = [
            ['风险等级', Paragraph(f'<font color="{risk_level_color.hexval()}"><b>{risk_info.get("risk_level", "-")}</b></font>', self.normal_style)],
            ['锈蚀概率', self._safe_text(risk_info.get('rust_probability'))],
            ['综合风险评分', str(risk_info.get('score', 0))],
            ['距上次保养天数', str(risk_info.get('days_since_last_maintenance')) if risk_info.get('days_since_last_maintenance') is not None else '无保养记录'],
            ['下次保养日期', self._safe_text(maintenance_info.get('next_maintenance_date'))],
            ['保养建议间隔', f"{self._safe_text(maintenance_info.get('recommended_interval_days'))} 天"],
        ]
        
        risk_table = Table(risk_data, colWidths=[4*cm, 10*cm])
        risk_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(risk_table)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph('三、风险因素分析', self.h2_style))
        
        quality = risk_info.get('maintenance_quality', {})
        factor_data = [
            ['材质风险系数', f"{risk_info.get('material_factor', 1):.2f}"],
            ['年代老化系数', f"{risk_info.get('aging_factor', 1):.2f}"],
            ['保养频率系数', f"{risk_info.get('maintenance_freq_factor', 1):.2f}"],
            ['环境湿度系数', f"{risk_info.get('humidity_factor', 1):.2f}"],
            ['锈蚀历史系数', f"{risk_info.get('rust_history_factor', 1):.2f}"],
            ['保养质量系数', f"{risk_info.get('maintenance_quality_factor', 1):.2f}"],
        ]
        
        factor_table = Table(factor_data, colWidths=[4*cm, 10*cm])
        factor_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(factor_table)
        story.append(Spacer(1, 15))
        
        if quality.get('score'):
            story.append(Paragraph('四、保养质量评估', self.h2_style))
            
            trend_map = {
                'improving': '改善中',
                'worsening': '恶化中',
                'stable': '稳定'
            }
            
            quality_data = [
                ['保养质量评分', f"{quality.get('score', 50)} / 100"],
                ['质量等级', self._safe_text(quality.get('level', '无数据'))],
                ['变化趋势', trend_map.get(quality.get('trend'), '稳定')],
                ['详细分析', self._safe_text(quality.get('detail', '-'))],
            ]
            
            quality_table = Table(quality_data, colWidths=[4*cm, 10*cm])
            quality_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(quality_table)
            story.append(Spacer(1, 15))
            
            story.append(Paragraph('五、保养提示', self.h2_style))
        else:
            story.append(Paragraph('四、保养提示', self.h2_style))
        
        story.append(Paragraph(self._safe_text(maintenance_info.get('urgency')), self.normal_style))
        story.append(Spacer(1, 15))
        
        story.append(Paragraph('五、历史保养记录', self.h2_style))
        
        if records:
            header = ['保养日期', '使用油品', '清洁方式', '除锈', '湿度(%)']
            record_rows = [header]
            
            for record in records:
                row = [
                    self._safe_text(record.get('maintenance_date')),
                    self._safe_text(record.get('oil_used')) or '-',
                    self._safe_text(record.get('cleaning_method')) or '-',
                    '是' if record.get('rust_removed') else '否',
                    str(record.get('humidity')) if record.get('humidity') else '-',
                ]
                record_rows.append(row)
            
            records_table = Table(record_rows, colWidths=[2.8*cm, 2.8*cm, 3*cm, 1.2*cm, 1.8*cm])
            records_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            story.append(records_table)
            
            if records:
                story.append(Spacer(1, 15))
                story.append(Paragraph('六、最近一次保养详情', self.h2_style))
                
                latest_record = records[0]
                
                detail_data = [
                    ['保养日期', self._safe_text(latest_record.get('maintenance_date'))],
                    ['使用油品', self._safe_text(latest_record.get('oil_used')) or '-'],
                    ['清洁方式', self._safe_text(latest_record.get('cleaning_method')) or '-'],
                    ['是否除锈', '是' if latest_record.get('rust_removed') else '否'],
                    ['环境湿度', f"{self._safe_text(latest_record.get('humidity'))}%" if latest_record.get('humidity') else '未记录'],
                    ['备注', self._safe_text(latest_record.get('notes')) or '-'],
                ]
                
                detail_table = Table(detail_data, colWidths=[4*cm, 10*cm])
                detail_table.setStyle(TableStyle([
                    ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 10),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('PADDING', (0, 0), (-1, -1), 8),
                ]))
                story.append(detail_table)
                
                before_img = self._add_image(latest_record.get('before_photo_path'))
                after_img = self._add_image(latest_record.get('after_photo_path'))
                
                if before_img or after_img:
                    story.append(Spacer(1, 15))
                    story.append(Paragraph('保养前后对比照片', self.h2_style))
                    
                    photo_data = []
                    photo_labels = []
                    
                    if before_img:
                        photo_data.append(before_img)
                        photo_labels.append('保养前')
                    
                    if after_img:
                        photo_data.append(after_img)
                        photo_labels.append('保养后')
                    
                    if photo_data:
                        photo_table = Table([photo_data, photo_labels], colWidths=[8*cm]*len(photo_data))
                        photo_table.setStyle(TableStyle([
                            ('FONT', (0, 0), (-1, -1), 'Chinese' if self.font_registered else 'Helvetica', 10),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                            ('PADDING', (0, 0), (-1, -1), 5),
                        ]))
                        story.append(photo_table)
        else:
            story.append(Paragraph('暂无保养记录', self.normal_style))
        
        doc.build(story)
        return output_path
