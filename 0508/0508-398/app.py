from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import os
import io
import math
import numpy as np
from database import init_db, get_stone_price, get_all_stones
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

DB_INITIALIZED = False

def init_database():
    global DB_INITIALIZED
    if not DB_INITIALIZED:
        init_db()
        DB_INITIALIZED = True

@app.route('/')
def index():
    init_database()
    return render_template('index.html')

@app.route('/api/stones', methods=['GET'])
def get_stones():
    init_database()
    stones = get_all_stones()
    return jsonify(stones)

REVETMENT_TYPES = {
    'taihu_revetment': {
        'name': '太湖石驳岸',
        'description': '瘦皱漏透，曲岸回环，以湖石错落叠砌，石间留有水口洞穴',
        'price_per_meter': 850,
        'height': 0.6,
        'volume_per_meter': 0.48
    },
    'huangshi_revetment': {
        'name': '黄石驳岸',
        'description': '棱角分明，刚劲有力，以黄石整块叠压，层层收分',
        'price_per_meter': 620,
        'height': 0.7,
        'volume_per_meter': 0.56
    },
    'natural_slope': {
        'name': '自然土坡',
        'description': '草坡入水，野趣天然，以土方塑形，植草护坡',
        'price_per_meter': 180,
        'height': 0.35,
        'volume_per_meter': 0.0
    }
}


def calculate_mountain_height(r, r_max, peak_height, shape_factor=2.0):
    """
    计算山体在距离中心r处的高度
    采用双曲函数模拟自然山形（锥形+顶部圆化）
    r: 距离中心的距离
    r_max: 最大半径（山体边缘）
    peak_height: 主峰高度
    shape_factor: 山形系数(越小越平缓，越大越陡峭)
    """
    if r >= r_max:
        return 0
    ratio = r / r_max
    base_height = peak_height * (1 - ratio ** shape_factor)
    top_rounding = peak_height * 0.3 * (1 - ratio * 2) * max(0, 1 - ratio * 2)
    return max(0, base_height + top_rounding)


def calculate_volume_by_integration(area, peak_height, grid_size=50, shape_factor=2.0):
    """
    分块积分法计算山体体积
    将山体在水平面上细分为 grid_size × grid_size 的网格
    对每个网格点计算高度，积分求和得到总体积
    
    参数:
        area: 投影面积 (m²)
        peak_height: 主峰高度 (m)
        grid_size: 网格细分精度(默认50×50)
        shape_factor: 山形系数(0.5~5.0，越小越平缓，越大越陡峭)
    返回:
        total_volume: 山体毛体积
        grid_details: 网格计算详情(用于展示)
    """
    import random
    random.seed(42)
    
    r_max = math.sqrt(area / math.pi) * 0.85
    
    half_width = math.sqrt(area) / 2
    cell_size = (half_width * 2) / grid_size
    cell_area = cell_size * cell_size
    
    total_volume = 0
    grid_details = []
    
    standard_shape_factor = 2.0
    standard_scalar = 2.1
    
    shape_scalar = standard_scalar * (shape_factor / standard_shape_factor) ** 0.7
    
    for i in range(grid_size):
        for j in range(grid_size):
            x = -half_width + (i + 0.5) * cell_size
            y = -half_width + (j + 0.5) * cell_size
            
            r = math.sqrt(x * x + y * y)
            
            if r <= r_max:
                base_h = calculate_mountain_height(r, r_max, peak_height, shape_factor)
                
                base_h *= shape_scalar
                
                irregular = 0.9 + random.random() * 0.2
                h = base_h * irregular
                
                cell_volume = h * cell_area
                total_volume += cell_volume
                
                if (i * grid_size + j) % (grid_size * grid_size // 9) == 0:
                    grid_details.append({
                        'x': round(x, 2),
                        'y': round(y, 2),
                        'r': round(r, 2),
                        'height': round(h, 3),
                        'volume': round(cell_volume, 4)
                    })
    
    return total_volume, grid_details, grid_size


@app.route('/api/calculate', methods=['POST'])
def calculate_rockery():
    init_database()
    data = request.json
    stone_type = data.get('stone_type')
    area = float(data.get('area', 0))
    height = float(data.get('height', 0))
    revetment_type = data.get('revetment_type', '')
    shape_factor = float(data.get('shape_factor', 2.0))
    
    if not stone_type or area <= 0 or height <= 0:
        return jsonify({'error': '参数不完整或无效'}), 400
    
    stone_info = get_stone_price(stone_type)
    if not stone_info:
        return jsonify({'error': '未知的石料类型'}), 400
    
    porosity = stone_info['porosity']
    price_per_cubic = stone_info['price_per_cubic']
    density = stone_info['density']
    
    gross_volume, grid_details, grid_count = calculate_volume_by_integration(
        area, height, grid_size=60, shape_factor=shape_factor
    )
    
    solid_volume = gross_volume * porosity
    
    stone_weight = solid_volume * density * 1000
    
    material_cost = solid_volume * price_per_cubic
    labor_cost = material_cost * 0.4
    transportation_cost = material_cost * 0.15
    total_cost = material_cost + labor_cost + transportation_cost
    
    simple_volume = area * height * porosity
    volume_diff = ((solid_volume - simple_volume) / simple_volume) * 100

    result = {
        'stone_info': stone_info,
        'input_params': {
            'stone_type': stone_type,
            'area': area,
            'height': height,
            'revetment_type': revetment_type,
            'shape_factor': shape_factor
        },
        'calculation': {
            'method': 'block_integration',
            'porosity': porosity,
            'solid_volume': round(solid_volume, 2),
            'gross_volume': round(gross_volume, 2),
            'stone_weight': round(stone_weight, 2),
            'formula': '分块积分法：V = ΣΣ h(x,y) × ΔS × 孔隙率',
            'formula_detail': f'{grid_count}×{grid_count}网格积分 × {porosity} = {round(solid_volume, 2)} m³',
            'grid_count': grid_count,
            'grid_details': grid_details[:12],
            'comparison': {
                'simple_method_volume': round(simple_volume, 2),
                'integration_method_volume': round(solid_volume, 2),
                'difference_percent': round(volume_diff, 2)
            }
        },
        'cost': {
            'material_cost': round(material_cost, 2),
            'labor_cost': round(labor_cost, 2),
            'transportation_cost': round(transportation_cost, 2),
            'total_cost': round(total_cost, 2),
            'price_per_cubic': price_per_cubic
        }
    }

    if revetment_type and revetment_type in REVETMENT_TYPES:
        rev_info = REVETMENT_TYPES[revetment_type]
        side_ratio = math.sqrt(area) * 0.8
        rev_length = round(2 * (side_ratio + side_ratio * 0.75), 2)
        rev_volume = round(rev_length * rev_info['volume_per_meter'], 2)
        rev_cost = round(rev_length * rev_info['price_per_meter'], 2)
        result['revetment'] = {
            'type': revetment_type,
            'name': rev_info['name'],
            'description': rev_info['description'],
            'length': rev_length,
            'height': rev_info['height'],
            'volume': rev_volume,
            'price_per_meter': rev_info['price_per_meter'],
            'cost': rev_cost
        }
        result['cost']['total_cost'] = round(total_cost + rev_cost, 2)
    
    return jsonify(result)

@app.route('/api/waterfall/spectrum', methods=['POST'])
def calculate_waterfall_spectrum():
    init_database()
    data = request.json
    flow_rate = float(data.get('flow_rate', 1.0))
    drop_height = float(data.get('drop_height', 2.0))
    
    if flow_rate <= 0 or drop_height <= 0:
        return jsonify({'error': '参数无效'}), 400
    
    impact_velocity = math.sqrt(2 * 9.8 * drop_height)
    base_freq = 120.0
    center_freq = base_freq * (1.0 + (flow_rate - 1.0) * 0.15) / (1.0 + (drop_height - 2.0) * 0.08)
    
    low_freq_band = (20, 250)
    mid_freq_band = (250, 1000)
    high_freq_band = (1000, 4000)
    
    low_energy_ratio = 0.35 + 0.25 * (flow_rate / 10.0) + 0.15 * (drop_height / 10.0)
    low_energy_ratio = min(low_energy_ratio, 0.85)
    mid_energy_ratio = 0.45 - 0.15 * (flow_rate / 10.0)
    high_energy_ratio = 1.0 - low_energy_ratio - mid_energy_ratio
    
    total_energy = 60 + 15 * math.log10(flow_rate) + 8 * math.log10(drop_height)
    total_energy = min(total_energy, 95)
    
    db_low = total_energy + 10 * math.log10(low_energy_ratio)
    db_mid = total_energy + 10 * math.log10(mid_energy_ratio)
    db_high = total_energy + 10 * math.log10(high_energy_ratio)
    
    num_points = 100
    frequencies = np.logspace(np.log10(20), np.log10(4000), num_points)
    spectrum = []
    
    for freq in frequencies:
        if freq < 250:
            band_center = (20 + 250) / 2
            db = db_low - 3 * ((freq - band_center) / 115) ** 2
        elif freq < 1000:
            band_center = (250 + 1000) / 2
            db = db_mid - 5 * ((freq - band_center) / 375) ** 2
        else:
            band_center = (1000 + 4000) / 2
            db = db_high - 8 * ((freq - band_center) / 1500) ** 2
        spectrum.append({'frequency': round(freq, 1), 'amplitude': round(max(db, 20), 1)})
    
    return jsonify({
        'input_params': {
            'flow_rate': flow_rate,
            'drop_height': drop_height
        },
        'spectrum': {
            'center_frequency': round(center_freq, 1),
            'impact_velocity': round(impact_velocity, 2),
            'total_spl': round(total_energy, 1),
            'low_freq_energy_ratio': round(low_energy_ratio * 100, 1),
            'mid_freq_energy_ratio': round(mid_energy_ratio * 100, 1),
            'high_freq_energy_ratio': round(high_energy_ratio * 100, 1),
            'low_freq_db': round(db_low, 1),
            'mid_freq_db': round(db_mid, 1),
            'high_freq_db': round(db_high, 1),
            'data': spectrum
        },
        'bands': [
            {'name': '低频 (20-250Hz)', 'energy_ratio': round(low_energy_ratio * 100, 1), 'db': round(db_low, 1)},
            {'name': '中频 (250-1000Hz)', 'energy_ratio': round(mid_energy_ratio * 100, 1), 'db': round(db_mid, 1)},
            {'name': '高频 (1000-4000Hz)', 'energy_ratio': round(high_energy_ratio * 100, 1), 'db': round(db_high, 1)}
        ]
    })

@app.route('/api/export/pdf', methods=['POST'])
def export_pdf():
    init_database()
    data = request.json
    
    stone_type = data.get('stone_type')
    area = float(data.get('area', 0))
    height = float(data.get('height', 0))
    flow_rate = float(data.get('flow_rate', 0))
    drop_height = float(data.get('drop_height', 0))
    revetment_type = data.get('revetment_type', '')
    
    stone_info = get_stone_price(stone_type)
    if not stone_info:
        return jsonify({'error': '未知的石料类型'}), 400
    
    porosity = stone_info['porosity']
    price_per_cubic = stone_info['price_per_cubic']
    density = stone_info['density']
    
    shape_factor = float(data.get('shape_factor', 2.0))
    gross_volume, _, grid_count = calculate_volume_by_integration(
        area, height, grid_size=60, shape_factor=shape_factor
    )
    solid_volume = gross_volume * porosity
    
    stone_weight = solid_volume * density * 1000
    
    material_cost = solid_volume * price_per_cubic
    labor_cost = material_cost * 0.4
    transportation_cost = material_cost * 0.15
    total_cost = material_cost + labor_cost + transportation_cost
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, 
                            topMargin=20*mm, bottomMargin=20*mm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=20, 
                                 textColor=colors.HexColor('#2c5530'), spaceAfter=10)
    heading_style = ParagraphStyle('HeadingStyle', parent=styles['Heading2'], fontSize=14,
                                   textColor=colors.HexColor('#2c5530'), spaceAfter=8)
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    
    story = []
    
    story.append(Paragraph('苏州园林假山设计方案', title_style))
    story.append(Paragraph('传统掇山工艺 · 现代工程计算', ParagraphStyle('Subtitle', 
        parent=normal_style, fontSize=12, textColor=colors.gray, spaceAfter=15)))
    
    story.append(Paragraph('一、设计参数', heading_style))
    
    param_data = [
        ['项目', '参数值', '说明'],
        ['山体类型', stone_info['name'], stone_info['description']],
        ['占地投影面积', f'{area} m²', '假山水平面投影面积'],
        ['预期高度', f'{height} m', '假山主峰高度'],
        ['山形系数', f'{shape_factor}', f'{grid_count}×{grid_count}网格分块积分'],
        ['孔隙率系数', f'{porosity}', '《园冶》掇山理论系数'],
        ['驳岸样式', REVETMENT_TYPES.get(revetment_type, {}).get('name', '未选择'), REVETMENT_TYPES.get(revetment_type, {}).get('description', '')]
    ]
    
    param_table = Table(param_data, colWidths=[40*mm, 40*mm, 80*mm])
    param_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f0e8')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c5530')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(param_table)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph('二、石料清单', heading_style))
    story.append(Paragraph(f'计算方法：分块积分法 V = ΣΣ h(x,y) × ΔS × 孔隙率 ({grid_count}×{grid_count}网格)', 
        ParagraphStyle('Note', parent=normal_style, fontSize=9, textColor=colors.gray, spaceAfter=8)))
    
    stone_data = [
        ['项目', '数值', '计算公式'],
        ['石料实体方量', f'{round(solid_volume, 2)} m³', f'网格积分 × {porosity}'],
        ['堆砌总体积', f'{round(gross_volume, 2)} m³', '含施工间隙'],
        ['石料总重量', f'{round(stone_weight, 2)} kg', f'{round(solid_volume, 2)} × {density} × 1000'],
        ['石料单价', f'{price_per_cubic} 元/m³', stone_info['name']],
        ['石料采购费用', f'{round(material_cost, 2)} 元', f'{round(solid_volume, 2)} × {price_per_cubic}'],
        ['人工费用', f'{round(labor_cost, 2)} 元', '材料费 × 40%'],
        ['运输费用', f'{round(transportation_cost, 2)} 元', '材料费 × 15%'],
        ['总计造价', f'{round(total_cost, 2)} 元', '']
    ]
    
    stone_table = Table(stone_data, colWidths=[45*mm, 45*mm, 70*mm])
    stone_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f0e8')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c5530')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('BACKGROUND', (-1, -1), (-1, -1), colors.HexColor('#fff8dc')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (0, -1), colors.HexColor('#fff8dc')),
        ('BACKGROUND', (1, -1), (1, -1), colors.HexColor('#fff8dc')),
    ]))
    story.append(stone_table)
    story.append(Spacer(1, 10))
    
    if revetment_type and revetment_type in REVETMENT_TYPES:
        story.append(Paragraph('三、驳岸工程', heading_style))
        rev_info = REVETMENT_TYPES[revetment_type]
        side_ratio = math.sqrt(area) * 0.8
        rev_length = round(2 * (side_ratio + side_ratio * 0.75), 2)
        rev_volume = round(rev_length * rev_info['volume_per_meter'], 2)
        rev_cost = round(rev_length * rev_info['price_per_meter'], 2)
        
        rev_data = [
            ['项目', '数值', '说明'],
            ['驳岸类型', rev_info['name'], rev_info['description']],
            ['驳岸长度', f'{rev_length} m', '依水岸线周长估算'],
            ['驳岸高度', f'{rev_info["height"]} m', '高出常水位'],
            ['石料方量', f'{rev_volume} m³', f'{rev_length} × {rev_info["volume_per_meter"]}'],
            ['单价', f'{rev_info["price_per_meter"]} 元/m', '含材料及人工'],
            ['驳岸造价', f'{rev_cost} 元', ''],
        ]
        rev_table = Table(rev_data, colWidths=[45*mm, 45*mm, 70*mm])
        rev_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f0e8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c5530')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ]))
        story.append(rev_table)
        story.append(Spacer(1, 10))
    
    if flow_rate > 0 and drop_height > 0:
        story.append(Paragraph('四、瀑布水景设计', heading_style))
        
        impact_velocity = math.sqrt(2 * 9.8 * drop_height)
        low_energy_ratio = 0.35 + 0.25 * (flow_rate / 10.0) + 0.15 * (drop_height / 10.0)
        low_energy_ratio = min(low_energy_ratio, 0.85)
        
        water_data = [
            ['项目', '参数值'],
            ['水流量', f'{flow_rate} m³/h'],
            ['落差高度', f'{drop_height} m'],
            ['冲击速度', f'{round(impact_velocity, 2)} m/s'],
            ['低频能量占比', f'{round(low_energy_ratio * 100, 1)}%'],
        ]
        water_table = Table(water_data, colWidths=[60*mm, 60*mm])
        water_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f0e8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c5530')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ]))
        story.append(water_table)
        story.append(Spacer(1, 10))
    
    story.append(Paragraph('五、施工要点', heading_style))
    
    construction_points = [
        '1. <b>基础处理</b>：假山基础必须夯实，承载力不小于120kPa，铺设150mm厚C20混凝土垫层。',
        '2. <b>石料选择</b>：选用质地均匀、无裂纹的整块石料，主石突出、次石相辅、宾主分明。',
        '3. <b>堆叠工艺</b>：遵循"安、连、接、斗、挎、拼、悬、剑、卡、垂"十字诀，错落有致。',
        '4. <b>填缝处理</b>：使用高标号水泥砂浆填缝，缝宽不超过20mm，表面做仿古处理。',
        '5. <b>结构安全</b>：每堆叠1.5米高度需设置拉结石，确保整体稳定性。',
        '6. <b>植物配植</b>：预留种植穴，选用虎耳草、常春藤等乡土藤蔓植物，营造自然野趣。',
        '7. <b>瀑布管线</b>：预埋PPR给水管，设置阀门井便于流量调节，落水口做消能处理。',
        '8. <b>管线隐蔽</b>：所有水电管线需隐藏于山石缝隙中，不得破坏景观效果。',
        '9. <b>驳岸施工</b>：驳岸基槽开挖至老土层，石料错缝搭砌，砂浆饱满度不低于80%。',
        '10. <b>防渗处理</b>：水池底板及侧壁做两布一膜防渗层，蓄水试验24小时无渗漏。',
    ]
    
    for point in construction_points:
        story.append(Paragraph(point, normal_style))
        story.append(Spacer(1, 4))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph('六、设计依据', heading_style))
    story.append(Paragraph('• 《园冶》 - 明代计成，中国古代造园专著', normal_style))
    story.append(Paragraph('• 《假山工程技术规程》CJJ/T 275-2018', normal_style))
    story.append(Paragraph('• 《风景园林图例图示标准》CJJ 67-95', normal_style))
    story.append(Paragraph('• 苏州园林传统掇山工艺非遗传承技法', normal_style))
    
    story.append(Spacer(1, 15))
    story.append(Paragraph(f'设计日期：2026年5月29日', ParagraphStyle('Date', 
        parent=normal_style, fontSize=10, textColor=colors.gray, alignment=1)))
    
    doc.build(story)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'苏州园林假山设计方案_{stone_info["name"]}_{area}m².pdf'
    )

if __name__ == '__main__':
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=True)
