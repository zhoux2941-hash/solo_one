from PIL import Image, ImageDraw, ImageFont
import math
from datetime import datetime

def export_design_image(filepath, design_data, format='PNG', dpi=300, width=2480, height=3508):
    img = Image.new('RGB', (width, height), '#FFF8F0')
    draw = ImageDraw.Draw(img)
    
    margin = int(width * 0.08)
    content_width = width - 2 * margin
    y_pos = margin
    
    try:
        title_font = ImageFont.truetype("msyh.ttc", int(width * 0.025))
        subtitle_font = ImageFont.truetype("msyh.ttc", int(width * 0.015))
        section_font = ImageFont.truetype("msyh.ttc", int(width * 0.018))
        normal_font = ImageFont.truetype("msyh.ttc", int(width * 0.014))
        small_font = ImageFont.truetype("msyh.ttc", int(width * 0.011))
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        section_font = ImageFont.load_default()
        normal_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    draw.text((width // 2, y_pos), '竹编工艺设计图纸', fill='#2F4F4F', font=title_font, anchor='mt')
    y_pos += int(width * 0.04)
    
    draw.text((width // 2, y_pos), f'方案名称: {design_data["name"]}', fill='#696969', font=subtitle_font, anchor='mt')
    y_pos += int(width * 0.02)
    draw.text((width // 2, y_pos), f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', fill='#696969', font=subtitle_font, anchor='mt')
    y_pos += int(width * 0.04)
    
    y_pos = _draw_section(draw, '一、基本参数', width, y_pos, section_font, small_font)
    
    pattern_name = '人字纹' if design_data['pattern_type'] == 'herringbone' else '六角眼'
    strip_thickness = design_data.get('strip_thickness', design_data['strip_width'] * 0.15)
    params = [
        ('开口直径', f'{design_data["opening_diameter"]} mm'),
        ('底部直径', f'{design_data["bottom_diameter"]} mm'),
        ('篮筐高度', f'{design_data["height"]} mm'),
        ('竹篾宽度', f'{design_data["strip_width"]} mm'),
        ('竹篾厚度', f'{strip_thickness} mm'),
        ('编织纹样', pattern_name),
    ]
    y_pos = _draw_table(draw, params, width, y_pos, small_font, '#F5DEB3')
    y_pos += int(width * 0.02)
    
    y_pos = _draw_section(draw, '二、计算结果', width, y_pos, section_font, small_font)
    
    gap_inner = design_data.get('warp_gap_inner', 0)
    gap_outer = design_data.get('warp_gap_outer', 0)
    if gap_inner >= 0:
        gap_info = f'内{gap_inner}mm / 外{gap_outer}mm（均匀分布）'
    else:
        gap_info = f'重叠{-gap_inner}mm（建议调整参数）'
    
    results = [
        ('经线根数', f'{design_data["warp_count"]} 根'),
        ('纬线每层根数', f'{design_data["weft_per_layer"]} 根'),
        ('纬线总层数', f'{design_data["weft_layers"]} 层'),
        ('竹篾估算用量', f'{design_data["strip_length_estimate"]} 米'),
        ('经线间隙', gap_info),
    ]
    y_pos = _draw_table(draw, results, width, y_pos, small_font, '#E8DCC8')
    y_pos += int(width * 0.02)
    
    if y_pos + int(width * 0.28) < height - margin:
        y_pos = _draw_section(draw, '三、编织展开示意图', width, y_pos, section_font, small_font)
        y_pos += int(width * 0.01)
        grid_height = int(width * 0.25)
        _draw_grid_pattern(draw, design_data['warp_count'], design_data['weft_layers'], width, y_pos, grid_height, margin)
        y_pos += grid_height + int(width * 0.02)
    
    if y_pos + int(width * 0.28) < height - margin:
        y_pos = _draw_section(draw, '四、纹样示意图', width, y_pos, section_font, small_font)
        y_pos += int(width * 0.01)
        pattern_height = int(width * 0.25)
        if design_data['pattern_type'] == 'herringbone':
            _draw_herringbone_pattern(draw, design_data['warp_count'], design_data['weft_layers'], width, y_pos, pattern_height, margin)
        else:
            _draw_hexagon_pattern(draw, design_data['warp_count'], design_data['weft_layers'], width, y_pos, pattern_height, margin)
        y_pos += pattern_height + int(width * 0.02)
    
    if y_pos + int(width * 0.15) < height - margin:
        y_pos = _draw_section(draw, '五、编织说明', width, y_pos, section_font, small_font)
        instructions = [
            f'1. 经线：从底部圆周均匀分布，共 {design_data["warp_count"]} 根，贯穿篮筐高度。',
            f'2. 纬线：每层 {design_data["weft_per_layer"]} 根，共 {design_data["weft_layers"]} 层。',
            f'3. 竹篾准备：估算总用量约 {design_data["strip_length_estimate"]} 米（含搭接余量）。',
            '4. 编织顺序：先固定经线，再从底部向上逐层编织纬线。',
            '5. 注意事项：编织时保持竹篾松紧一致，确保篮筐圆润。',
        ]
        for instr in instructions:
            draw.text((margin, y_pos), instr, fill='#3E2723', font=small_font)
            y_pos += int(width * 0.018)
    
    img.save(filepath, format=format.upper(), dpi=(dpi, dpi))
    return True

def _draw_section(draw, title, width, y, section_font, small_font):
    draw.text((int(width * 0.08), y), title, fill='#2F4F4F', font=section_font)
    line_y = y + int(width * 0.02)
    draw.line([(int(width * 0.08), line_y), (int(width * 0.92), line_y)], fill='#8B7355', width=2)
    return y + int(width * 0.03)

def _draw_table(draw, items, width, y, font, bg_color):
    col1_x = int(width * 0.08)
    col2_x = int(width * 0.35)
    cell_height = int(width * 0.028)
    start_y = y
    
    for i, (key, value) in enumerate(items):
        cell_y = start_y + i * cell_height
        draw.rectangle([(col1_x, cell_y), (int(width * 0.92), cell_y + cell_height)], outline='#8B7355', width=2)
        draw.rectangle([(col1_x, cell_y), (col2_x, cell_y + cell_height)], fill=bg_color, outline='#8B7355', width=1)
        draw.text((col1_x + int(width * 0.01), cell_y + int(width * 0.005)), key, fill='#333333', font=font)
        draw.text((col2_x + int(width * 0.01), cell_y + int(width * 0.005)), value, fill='#333333', font=font)
    
    return start_y + len(items) * cell_height + int(width * 0.01)

def _draw_grid_pattern(draw, warp_count, weft_layers, width, y, height, margin):
    start_x = int(width * 0.08)
    end_x = int(width * 0.92)
    start_y = y
    end_y = y + height
    pattern_width = end_x - start_x
    
    draw.rectangle([(start_x, start_y), (end_x, end_y)], outline='#333333', width=3, fill='#FFFFFF')
    
    for i in range(warp_count + 1):
        x = start_x + (pattern_width / warp_count) * i
        draw.line([(x, start_y), (x, end_y)], fill='#6495ED', width=2)
    
    for j in range(weft_layers + 1):
        y_pos = start_y + (height / weft_layers) * j
        draw.line([(start_x, y_pos), (end_x, y_pos)], fill='#CD5C5C', width=1)

def _draw_herringbone_pattern(draw, warp_count, weft_layers, width, y, height, margin):
    start_x = int(width * 0.08)
    end_x = int(width * 0.92)
    start_y = y
    end_y = y + height
    pattern_width = end_x - start_x
    
    draw.rectangle([(start_x, start_y), (end_x, end_y)], outline='#333333', width=3, fill='#FFFAF0')
    
    warp_spacing = pattern_width / (warp_count + 1)
    weft_spacing = height / (weft_layers + 1)
    
    for i in range(warp_count + 2):
        x = start_x + i * warp_spacing
        draw.line([(x, start_y), (x, end_y)], fill='#B4826E', width=1)
    
    for j in range(1, weft_layers + 1):
        y_pos = start_y + j * weft_spacing
        offset = (j % 2) * warp_spacing / 2
        for i in range(0, warp_count, 2):
            x1 = start_x + i * warp_spacing + offset
            x2 = start_x + (i + 1) * warp_spacing + offset
            mid_x = (x1 + x2) / 2
            segment_h = warp_spacing / 2
            
            points = [(x1, y_pos - segment_h / 2), (mid_x, y_pos), (x2, y_pos - segment_h / 2)]
            draw.line(points, fill='#8B5A2B', width=3)

def _draw_hexagon_pattern(draw, warp_count, weft_layers, width, y, height, margin):
    start_x = int(width * 0.08)
    end_x = int(width * 0.92)
    start_y = y
    end_y = y + height
    pattern_width = end_x - start_x
    
    draw.rectangle([(start_x, start_y), (end_x, end_y)], outline='#333333', width=3, fill='#FFFAF0')
    
    hex_radius = min(pattern_width / (warp_count * 1.5), height / (weft_layers * 1.732))
    hex_width = hex_radius * 2
    hex_height = hex_radius * math.sqrt(3)
    
    cols = int(pattern_width / (hex_width * 0.75))
    rows = int(height / hex_height)
    
    for row in range(rows):
        for col in range(cols):
            offset_x = hex_width * 0.75 * col
            offset_y = hex_height * row
            if col % 2 == 1:
                offset_y += hex_height / 2
            
            cx = start_x + offset_x + hex_radius
            cy = start_y + offset_y + hex_height / 2
            
            if cx < end_x and cy < end_y:
                points = []
                for i in range(6):
                    angle = math.pi / 3 * i - math.pi / 6
                    px = cx + hex_radius * 0.9 * math.cos(angle)
                    py = cy + hex_radius * 0.9 * math.sin(angle)
                    points.append((px, py))
                
                draw.polygon(points, outline='#8B5A2B', width=2)

def export_preview_image(filepath, image_data, format='PNG'):
    from PyQt5.QtGui import QImage, QPixmap
    if isinstance(image_data, QImage):
        image_data.save(filepath, format.upper())
    elif isinstance(image_data, QPixmap):
        image_data.save(filepath, format.upper())
    return True
