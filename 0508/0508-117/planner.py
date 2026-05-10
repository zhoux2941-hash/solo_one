from datetime import datetime, timedelta

PACE_TYPES = {
    'easy': '轻松跑',
    'tempo': '节奏跑',
    'interval': '间歇跑',
    'rest': '休息日',
    'long': '长距离跑'
}

GOAL_CONFIGS = {
    '5公里': {
        'base_increase_rate': 0.1,
        'max_increase_rate': 0.15,
        'interval_frequency': 1,
        'tempo_frequency': 1,
        'long_run_ratio': 0.4,
        'target_distance': 5
    },
    '半马': {
        'base_increase_rate': 0.08,
        'max_increase_rate': 0.12,
        'interval_frequency': 1,
        'tempo_frequency': 1,
        'long_run_ratio': 0.45,
        'target_distance': 21.1
    },
    '全马': {
        'base_increase_rate': 0.06,
        'max_increase_rate': 0.10,
        'interval_frequency': 1,
        'tempo_frequency': 1,
        'long_run_ratio': 0.5,
        'target_distance': 42.2
    }
}

def generate_8_week_plan(goal, current_weekly_distance, training_days, start_date):
    config = GOAL_CONFIGS[goal]
    plan = []
    
    current_distance = float(current_weekly_distance)
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    
    for week in range(1, 9):
        is_taper_week = (week % 4 == 0)
        
        if week == 8:
            weekly_distance = current_distance * 0.6
        elif is_taper_week:
            weekly_distance = current_distance * 0.7
        else:
            increase_rate = config['base_increase_rate']
            weekly_distance = current_distance * (1 + increase_rate)
            current_distance = weekly_distance
        
        week_days = distribute_weekly_distance(
            weekly_distance, 
            training_days, 
            config,
            is_taper_week or week == 8,
            goal,
            week
        )
        
        for day_idx, day in enumerate(week_days):
            day_date = start_dt + timedelta(days=(week - 1) * 7 + day_idx)
            plan.append({
                'week_number': week,
                'day_of_week': day_idx + 1,
                'date': day_date.strftime('%Y-%m-%d'),
                'distance': day['distance'],
                'pace_type': day['pace_type'],
                'notes': ''
            })
    
    return plan

def distribute_weekly_distance(weekly_distance, training_days, config, is_taper, goal, week_number):
    days = []
    training_day_indices = select_training_days(training_days)
    
    long_run_day = max(training_day_indices)
    quality_day1 = min(training_day_indices)
    
    if len(training_day_indices) >= 3:
        remaining_days = [d for d in training_day_indices if d not in [long_run_day, quality_day1]]
        quality_day2 = remaining_days[0]
    else:
        quality_day2 = None
    
    for day in range(7):
        if day not in training_day_indices:
            days.append({'distance': 0, 'pace_type': 'rest'})
            continue
        
        if day == long_run_day:
            if is_taper:
                distance = weekly_distance * config['long_run_ratio'] * 0.7
            else:
                distance = weekly_distance * config['long_run_ratio']
            
            if week_number == 8:
                distance = min(distance, config['target_distance'] * 0.3)
            
            days.append({'distance': round(distance, 1), 'pace_type': 'long'})
        elif day == quality_day1:
            if is_taper:
                distance = weekly_distance * 0.15
                days.append({'distance': round(distance, 1), 'pace_type': 'easy'})
            else:
                distance = weekly_distance * 0.2
                days.append({'distance': round(distance, 1), 'pace_type': 'interval'})
        elif day == quality_day2:
            if is_taper:
                distance = weekly_distance * 0.15
                days.append({'distance': round(distance, 1), 'pace_type': 'easy'})
            else:
                distance = weekly_distance * 0.2
                days.append({'distance': round(distance, 1), 'pace_type': 'tempo'})
        else:
            remaining_ratio = 1 - config['long_run_ratio'] - 0.4
            other_days_count = max(1, len([d for d in training_day_indices if d not in [long_run_day, quality_day1, quality_day2]]))
            per_day_ratio = remaining_ratio / other_days_count
            distance = weekly_distance * per_day_ratio
            days.append({'distance': round(distance, 1), 'pace_type': 'easy'})
    
    return days

def select_training_days(training_days):
    default_patterns = {
        3: [1, 3, 6],
        4: [1, 3, 5, 6],
        5: [1, 2, 4, 5, 6],
        6: [0, 1, 2, 4, 5, 6],
        7: [0, 1, 2, 3, 4, 5, 6]
    }
    return default_patterns.get(training_days, [1, 3, 6])

PACE_DISTANCE_RANGES = {
    'easy': {'min': 2.0, 'max': 15.0, 'priority': 2},
    'tempo': {'min': 3.0, 'max': 12.0, 'priority': 3},
    'interval': {'min': 2.0, 'max': 10.0, 'priority': 4},
    'long': {'min': 8.0, 'max': 42.0, 'priority': 1},
    'rest': {'min': 0, 'max': 0, 'priority': 0}
}

def get_adjustable_range(day):
    pace_type = day['pace_type']
    ranges = PACE_DISTANCE_RANGES.get(pace_type, PACE_DISTANCE_RANGES['easy'])
    current = day['distance']
    
    can_increase = ranges['max'] - current
    can_decrease = current - ranges['min']
    
    return {
        'can_increase': max(0, can_increase),
        'can_decrease': max(0, can_decrease),
        'priority': ranges['priority']
    }

def rebalance_plan(training_days, modified_day_index, new_distance):
    if modified_day_index >= len(training_days):
        return training_days
    
    plan = [day.copy() for day in training_days]
    original_distance = plan[modified_day_index]['distance']
    distance_diff = new_distance - original_distance
    
    if distance_diff == 0:
        return plan
    
    modified_day = plan[modified_day_index]
    modified_range = get_adjustable_range(modified_day)
    
    if distance_diff > 0:
        actual_increase = min(distance_diff, modified_range['can_increase'])
        new_distance = original_distance + actual_increase
        distance_diff = actual_increase
    else:
        actual_decrease = max(distance_diff, -modified_range['can_decrease'])
        new_distance = original_distance + actual_decrease
        distance_diff = actual_decrease
    
    plan[modified_day_index]['distance'] = round(new_distance, 1)
    
    if distance_diff == 0:
        return plan
    
    remaining_days = plan[modified_day_index + 1:]
    
    adjustment_needed = -distance_diff
    
    day_info = []
    for i, day in enumerate(remaining_days):
        if day['pace_type'] == 'rest':
            continue
        adj_range = get_adjustable_range(day)
        day_info.append({
            'index': i,
            'day': day,
            'current': day['distance'],
            'can_increase': adj_range['can_increase'],
            'can_decrease': adj_range['can_decrease'],
            'priority': adj_range['priority']
        })
    
    if not day_info:
        return plan
    
    if adjustment_needed > 0:
        available_capacity = sum(info['can_increase'] for info in day_info)
        if available_capacity <= 0:
            return plan
        
        day_info.sort(key=lambda x: (x['priority'], -x['can_increase']))
        
        remaining_adjustment = adjustment_needed
        for info in day_info:
            if remaining_adjustment <= 0:
                break
            
            max_possible = info['can_increase']
            if max_possible <= 0:
                continue
            
            share = min(max_possible, remaining_adjustment * (info['can_increase'] / available_capacity))
            share = max(0.5, round(share, 1))
            
            actual_share = min(share, max_possible, remaining_adjustment)
            
            info['day']['distance'] = round(info['current'] + actual_share, 1)
            remaining_adjustment -= actual_share
        
        if remaining_adjustment > 0:
            for info in sorted(day_info, key=lambda x: x['priority']):
                if remaining_adjustment <= 0:
                    break
                can_add = min(remaining_adjustment, info['can_increase'])
                if can_add > 0:
                    info['day']['distance'] = round(info['day']['distance'] + can_add, 1)
                    remaining_adjustment -= can_add
    
    else:
        total_reducible = sum(info['can_decrease'] for info in day_info)
        reduction_needed = -adjustment_needed
        
        if total_reducible <= 0 or reduction_needed <= 0:
            return plan
        
        day_info.sort(key=lambda x: (-x['priority'], x['can_decrease']))
        
        remaining_reduction = reduction_needed
        for info in day_info:
            if remaining_reduction <= 0:
                break
            
            max_possible = info['can_decrease']
            if max_possible <= 0:
                continue
            
            share = min(max_possible, remaining_reduction * (info['can_decrease'] / total_reducible))
            share = max(0.5, round(share, 1))
            
            actual_share = min(share, max_possible, remaining_reduction)
            
            info['day']['distance'] = round(info['current'] - actual_share, 1)
            remaining_reduction -= actual_share
        
        if remaining_reduction > 0:
            for info in sorted(day_info, key=lambda x: -x['priority']):
                if remaining_reduction <= 0:
                    break
                can_reduce = min(remaining_reduction, info['can_decrease'])
                if can_reduce > 0:
                    current_range = get_adjustable_range(info['day'])
                    can_reduce = min(can_reduce, current_range['can_decrease'])
                    if can_reduce > 0:
                        info['day']['distance'] = round(info['day']['distance'] - can_reduce, 1)
                        remaining_reduction -= can_reduce
    
    for i, day in enumerate(remaining_days):
        plan[modified_day_index + 1 + i] = day
    
    return plan
