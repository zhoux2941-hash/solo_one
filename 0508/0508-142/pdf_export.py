from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.graphics.shapes import Drawing, Line, Polygon, Rect
from reportlab.graphics import renderPDF
import io
import math
from datetime import datetime

def export_design_pdf(filepath, design_data):
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2F4F4F')
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#696969')
    )
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=5
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading3'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor('#2F4F4F')
    )
    
    story = []
    
    story.append(Paragraph('竹编工艺设计图纸', title_style))
    story.append(Paragraph(f'方案名称: {design_data["name"]}', subtitle_style))
    story.append(Paragraph(f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', subtitle_style))
    story.append(Spacer(1, 15))
    
    story.append(Paragraph('一、基本参数', section_style))
    pattern_name = '人字纹' if design_data['pattern_type'] == 'herringbone' else '六角眼'
    strip_thickness = design_data.get('strip_thickness', design_data['strip_width'] * 0.15)
    params_data = [
        ['开口直径', f'{design_data["opening_diameter"]} mm'],
        ['底部直径', f'{design_data["bottom_diameter"]} mm'],
        ['篮筐高度', f'{design_data["height"]} mm'],
        ['竹篾宽度', f'{design_data["strip_width"]} mm'],
        ['竹篾厚度', f'{strip_thickness} mm'],
        ['编织纹样', pattern_name]
    ]
    params_table = Table(params_data, colWidths=[5*cm, 4*cm])
    params_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5DEB3')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#8B7355')),
    ]))
    story.append(params_table)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph('二、计算结果', section_style))
    gap_inner = design_data.get('warp_gap_inner', 0)
    gap_outer = design_data.get('warp_gap_outer', 0)
    if gap_inner >= 0:
        gap_info = f'内{gap_inner}mm / 外{gap_outer}mm（均匀分布）'
    else:
        gap_info = f'重叠{-gap_inner}mm（建议调整参数）'
    
    results_data = [
        ['经线根数', f'{design_data["warp_count"]} 根'],
        ['纬线每层根数', f'{design_data["weft_per_layer"]} 根'],
        ['纬线总层数', f'{design_data["weft_layers"]} 层'],
        ['竹篾估算用量', f'{design_data["strip_length_estimate"]} 米'],
        ['经线间隙', gap_info],
    ]
    results_table = Table(results_data, colWidths=[5*cm, 6*cm])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8DCC8')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#8B7355')),
    ]))
    story.append(results_table)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph('三、编织展开示意图', section_style))
    drawing = create_grid_drawing(
        design_data['warp_count'],
        design_data['weft_layers'],
        width=16*cm,
        height=10*cm
    )
    story.append(drawing)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph('四、纹样示意图', section_style))
    if design_data['pattern_type'] == 'herringbone':
        pattern_drawing = create_herringbone_drawing(
            design_data['warp_count'],
            design_data['weft_layers'],
            width=16*cm,
            height=10*cm
        )
    else:
        pattern_drawing = create_hexagon_drawing(
            design_data['warp_count'],
            design_data['weft_layers'],
            width=16*cm,
            height=10*cm
        )
    story.append(pattern_drawing)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph('五、精度说明', section_style))
    precision_notes = [
        '● 本计算已考虑竹篾厚度的径向累积效应，避免最后一条缝隙过大或过小。',
        '● 使用精确几何模型：计算竹篾在圆周上实际占据的圆心角，选择根数使剩余角度均匀分配。',
        '● 显示内外侧实际间隙值，便于验证编织可行性。',
    ]
    for note in precision_notes:
        story.append(Paragraph(note, normal_style))
    
    story.append(Paragraph('六、编织说明', section_style))
    instructions = [
        '1. 经线：从底部圆周均匀分布，共 {} 根，贯穿篮筐高度。'.format(design_data['warp_count']),
        '2. 纬线：每层 {} 根，共 {} 层，沿高度方向逐层编织。'.format(design_data['weft_per_layer'], design_data['weft_layers']),
        '3. 竹篾准备：估算总用量约 {} 米（含搭接余量）。'.format(design_data['strip_length_estimate']),
        '4. 编织顺序：先固定经线，再从底部向上逐层编织纬线。',
        '5. 注意事项：编织时保持竹篾松紧一致，确保篮筐圆润。如间隙显示重叠，建议调整参数。'
    ]
    for instr in instructions:
        story.append(Paragraph(instr, normal_style))
    
    doc.build(story)

def create_grid_drawing(warp_count, weft_layers, width=400, height=250):
    d = Drawing(width, height)
    
    margin = 20
    inner_width = width - 2 * margin
    inner_height = height - 2 * margin
    
    border = Rect(margin, margin, inner_width, inner_height, 
                  strokeColor=colors.HexColor('#333333'), strokeWidth=2, fillColor=None)
    d.add(border)
    
    for i in range(warp_count + 1):
        x = margin + (inner_width / warp_count) * i
        line = Line(x, margin, x, margin + inner_height, 
                    strokeColor=colors.HexColor('#6495ED'), strokeWidth=1.5)
        d.add(line)
    
    for j in range(weft_layers + 1):
        y = margin + (inner_height / weft_layers) * j
        line = Line(margin, y, margin + inner_width, y, 
                    strokeColor=colors.HexColor('#CD5C5C'), strokeWidth=1)
        d.add(line)
    
    return d

def create_herringbone_drawing(warp_count, weft_layers, width=400, height=250):
    d = Drawing(width, height)
    
    margin = 20
    inner_width = width - 2 * margin
    inner_height = height - 2 * margin
    
    warp_spacing = inner_width / (warp_count + 1)
    weft_spacing = inner_height / (weft_layers + 1)
    
    for i in range(warp_count + 2):
        x = margin + i * warp_spacing
        line = Line(x, margin, x, margin + inner_height, 
                    strokeColor=colors.HexColor('#B4826E'), strokeWidth=0.8)
        d.add(line)
    
    for j in range(1, weft_layers + 1):
        y = margin + j * weft_spacing
        offset = (j % 2) * warp_spacing / 2
        for i in range(0, warp_count, 2):
            x1 = margin + i * warp_spacing + offset
            x2 = margin + (i + 1) * warp_spacing + offset
            mid_x = (x1 + x2) / 2
            segment_h = warp_spacing / 2
            
            poly = Polygon(
                [x1, y - segment_h / 2, mid_x, y, x2, y - segment_h / 2],
                strokeColor=colors.HexColor('#8B5A2B'),
                strokeWidth=1.5,
                fillColor=None
            )
            d.add(poly)
    
    return d

def create_hexagon_drawing(warp_count, weft_layers, width=400, height=250):
    d = Drawing(width, height)
    
    margin = 20
    inner_width = width - 2 * margin
    inner_height = height - 2 * margin
    
    hex_radius = min(inner_width / (warp_count * 1.5), inner_height / (weft_layers * 1.732))
    hex_width = hex_radius * 2
    hex_height = hex_radius * math.sqrt(3)
    
    cols = int(inner_width / (hex_width * 0.75))
    rows = int(inner_height / hex_height)
    
    for row in range(rows):
        for col in range(cols):
            offset_x = hex_width * 0.75 * col
            offset_y = hex_height * row
            if col % 2 == 1:
                offset_y += hex_height / 2
            
            cx = margin + offset_x + hex_radius
            cy = margin + offset_y + hex_height / 2
            
            if cx < margin + inner_width and cy < margin + inner_height:
                points = []
                for i in range(6):
                    angle = math.pi / 3 * i - math.pi / 6
                    x = cx + hex_radius * 0.9 * math.cos(angle)
                    y = cy + hex_radius * 0.9 * math.sin(angle)
                    points.extend([x, y])
                
                poly = Polygon(
                    points,
                    strokeColor=colors.HexColor('#8B5A2B'),
                    strokeWidth=1.2,
                    fillColor=None
                )
                d.add(poly)
    
    return d
