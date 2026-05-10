HEART_RATE_ZONES = {
    'zone1': {
        'name': '恢复区',
        'min_percent': 0.50,
        'max_percent': 0.60,
        'description': '非常轻松的活动，用于恢复',
        'rpe': '2-3'
    },
    'zone2': {
        'name': '燃脂区',
        'min_percent': 0.60,
        'max_percent': 0.70,
        'description': '轻松跑，可以正常对话',
        'rpe': '4-5'
    },
    'zone3': {
        'name': '有氧区',
        'min_percent': 0.70,
        'max_percent': 0.80,
        'description': '中等强度，说话略有困难',
        'rpe': '6-7'
    },
    'zone4': {
        'name': '阈值区',
        'min_percent': 0.80,
        'max_percent': 0.90,
        'description': '高强度，只能说短句',
        'rpe': '8'
    },
    'zone5': {
        'name': '极限区',
        'min_percent': 0.90,
        'max_percent': 1.00,
        'description': '最大强度，无法说话',
        'rpe': '9-10'
    }
}

PACE_HR_MAPPING = {
    'rest': {
        'zone': 'zone1',
        'min_offset': 0,
        'max_offset': 0.05,
        'description': '完全休息或极轻度活动'
    },
    'easy': {
        'zone': 'zone2',
        'min_offset': -0.03,
        'max_offset': 0.02,
        'description': '轻松跑，可以边跑边聊天'
    },
    'tempo': {
        'zone': 'zone4',
        'min_offset': -0.05,
        'max_offset': 0.00,
        'description': '节奏跑，接近乳酸阈值'
    },
    'interval': {
        'zone': 'zone5',
        'min_offset': -0.08,
        'max_offset': 0.00,
        'description': '间歇训练，高强度冲刺'
    },
    'long': {
        'zone': 'zone2',
        'min_offset': 0.00,
        'max_offset': 0.05,
        'description': '长距离慢跑，保持稳定'
    }
}

def calculate_heart_rate_zones(max_hr):
    if max_hr <= 0:
        return None
    
    zones = {}
    for zone_key, zone_info in HEART_RATE_ZONES.items():
        min_hr = int(round(max_hr * zone_info['min_percent']))
        max_hr_zone = int(round(max_hr * zone_info['max_percent']))
        
        zones[zone_key] = {
            **zone_info,
            'min_hr': min_hr,
            'max_hr': max_hr_zone,
            'range': f"{min_hr}-{max_hr_zone}"
        }
    
    return zones

def estimate_max_hr(age, resting_hr=60, gender='unknown'):
    if age <= 0:
        return None
    
    if gender == 'male':
        max_hr = 208 - 0.7 * age
    elif gender == 'female':
        max_hr = 206 - 0.88 * age
    else:
        max_hr = 220 - age
    
    return int(round(max_hr))

def calculate_hr_for_pace(pace_type, max_hr):
    if max_hr <= 0 or pace_type not in PACE_HR_MAPPING:
        return None
    
    mapping = PACE_HR_MAPPING[pace_type]
    base_zone = HEART_RATE_ZONES[mapping['zone']]
    
    min_percent = base_zone['min_percent'] + mapping['min_offset']
    max_percent = base_zone['max_percent'] + mapping['max_offset']
    
    min_percent = max(0.40, min(0.98, min_percent))
    max_percent = max(min_percent + 0.05, min(1.00, max_percent))
    
    min_hr = int(round(max_hr * min_percent))
    max_hr_pace = int(round(max_hr * max_percent))
    
    avg_hr = int(round((min_hr + max_hr_pace) / 2))
    
    return {
        'pace_type': pace_type,
        'zone': mapping['zone'],
        'zone_name': base_zone['name'],
        'min_hr': min_hr,
        'max_hr': max_hr_pace,
        'avg_hr': avg_hr,
        'range': f"{min_hr}-{max_hr_pace}",
        'description': mapping['description']
    }

def pace_to_km_per_hour(distance_km, time_minutes):
    if time_minutes <= 0 or distance_km <= 0:
        return None
    
    hours = time_minutes / 60
    return distance_km / hours

def km_per_hour_to_pace(km_per_hour):
    if km_per_hour <= 0:
        return None
    
    minutes_per_km = 60 / km_per_hour
    mins = int(minutes_per_km)
    secs = int(round((minutes_per_km - mins) * 60))
    return f"{mins}:{secs:02d}/km"

def pace_to_minutes_per_km(pace_string):
    try:
        if ':' in pace_string:
            parts = pace_string.replace('/km', '').split(':')
            mins = float(parts[0])
            secs = float(parts[1]) if len(parts) > 1 else 0
            return mins + secs / 60
    except:
        pass
    return None

def calculate_training_load(distance_km, pace_type, duration_minutes, max_hr, avg_hr):
    if max_hr <= 0 or duration_minutes <= 0:
        return None
    
    hr_ratio = avg_hr / max_hr if avg_hr > 0 else 0.7
    
    if hr_ratio < 0.6:
        trimp_factor = 0.6
    elif hr_ratio < 0.7:
        trimp_factor = 1.0
    elif hr_ratio < 0.8:
        trimp_factor = 1.6
    elif hr_ratio < 0.9:
        trimp_factor = 2.4
    else:
        trimp_factor = 3.0
    
    trimp = duration_minutes * hr_ratio * trimp_factor
    
    pace_factors = {
        'rest': 0.1,
        'easy': 1.0,
        'tempo': 1.8,
        'interval': 2.5,
        'long': 0.9
    }
    
    load_score = distance_km * pace_factors.get(pace_type, 1.0)
    
    return {
        'trimp': round(trimp, 1),
        'load_score': round(load_score, 1),
        'hr_ratio': round(hr_ratio, 2),
        'intensity_factor': trimp_factor
    }

def get_recommended_hr_range(goal, fitness_level='intermediate'):
    fitness_factors = {
        'beginner': 0.9,
        'intermediate': 1.0,
        'advanced': 1.05
    }
    
    factor = fitness_factors.get(fitness_level, 1.0)
    
    recommendations = {
        '5公里': {
            'easy': {'min': 0.60, 'max': 0.70},
            'tempo': {'min': 0.82, 'max': 0.88},
            'interval': {'min': 0.92, 'max': 0.98},
            'long': {'min': 0.62, 'max': 0.72}
        },
        '半马': {
            'easy': {'min': 0.62, 'max': 0.72},
            'tempo': {'min': 0.80, 'max': 0.86},
            'interval': {'min': 0.90, 'max': 0.96},
            'long': {'min': 0.65, 'max': 0.75}
        },
        '全马': {
            'easy': {'min': 0.60, 'max': 0.70},
            'tempo': {'min': 0.78, 'max': 0.84},
            'interval': {'min': 0.88, 'max': 0.94},
            'long': {'min': 0.63, 'max': 0.73}
        }
    }
    
    goal_rec = recommendations.get(goal, recommendations['半马'])
    
    result = {}
    for pace, ranges in goal_rec.items():
        result[pace] = {
            'min_percent': round(ranges['min'] * factor, 2),
            'max_percent': round(ranges['max'] * factor, 2)
        }
    
    return result

def format_hr_display(hr_info):
    if not hr_info:
        return "N/A"
    
    return (
        f"❤️ {hr_info['range']} bpm\n"
        f"({hr_info['zone_name']})"
    )

def get_hr_zone_color(zone_key):
    colors = {
        'zone1': '#90EE90',
        'zone2': '#98FB98',
        'zone3': '#FFFF99',
        'zone4': '#FFB347',
        'zone5': '#FF6347'
    }
    return colors.get(zone_key, '#FFFFFF')
