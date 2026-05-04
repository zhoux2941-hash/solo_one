from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import lru_cache
import json
import time
import threading
import math
from collections import OrderedDict, defaultdict
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

REQUEST_TIMEOUT = 1.5
MAX_REQUESTS_PER_SECOND = 10
CACHE_TTL = 60

request_lock = threading.Lock()
request_times = []

training_history = defaultdict(list)
training_plans = {}
history_lock = threading.Lock()
plan_lock = threading.Lock()

DEFAULT_USER_ID = 'default_user'

TRAINING_LEVELS = {
    'beginner': {'name': '初学者', 'min_score': 0, 'max_score': 60, 'sets': 2, 'reps': 8},
    'intermediate': {'name': '中级', 'min_score': 60, 'max_score': 80, 'sets': 3, 'reps': 12},
    'advanced': {'name': '高级', 'min_score': 80, 'max_score': 100, 'sets': 4, 'reps': 15}
}

WORKOUT_TEMPLATES = {
    'full_body': [
        {'pose_id': 'squat', 'focus': '腿部'},
        {'pose_id': 'pushup', 'focus': '胸部'},
        {'pose_id': 'plank', 'focus': '核心'}
    ],
    'lower_body': [
        {'pose_id': 'squat', 'focus': '腿部'},
        {'pose_id': 'squat', 'focus': '腿部'},
        {'pose_id': 'plank', 'focus': '核心'}
    ],
    'upper_body': [
        {'pose_id': 'pushup', 'focus': '胸部'},
        {'pose_id': 'pushup', 'focus': '胸部'},
        {'pose_id': 'plank', 'focus': '核心'}
    ],
    'core': [
        {'pose_id': 'plank', 'focus': '核心'},
        {'pose_id': 'plank', 'focus': '核心'},
        {'pose_id': 'squat', 'focus': '腿部'}
    ]
}

WEEKLY_SCHEDULE = [
    'full_body',
    'rest',
    'lower_body',
    'rest',
    'upper_body',
    'rest',
    'core'
]

class LRUCache:
    def __init__(self, capacity=100, ttl=60):
        self.cache = OrderedDict()
        self.capacity = capacity
        self.ttl = ttl
        self.lock = threading.Lock()
    
    def get(self, key):
        with self.lock:
            if key not in self.cache:
                return None
            item = self.cache[key]
            if time.time() - item['timestamp'] > self.ttl:
                del self.cache[key]
                return None
            self.cache.move_to_end(key)
            return item['value']
    
    def set(self, key, value):
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = {
                'value': value,
                'timestamp': time.time()
            }
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)
    
    def clear(self):
        with self.lock:
            self.cache.clear()

analysis_cache = LRUCache(capacity=200, ttl=2)

STANDARD_POSES = {
    "squat": {
        "name": "深蹲",
        "description": "标准深蹲动作",
        "key_angles": {
            "left_knee": {"min": 90, "max": 140, "ideal": 110},
            "right_knee": {"min": 90, "max": 140, "ideal": 110},
            "left_hip": {"min": 90, "max": 150, "ideal": 120},
            "right_hip": {"min": 90, "max": 150, "ideal": 120}
        },
        "common_errors": {
            "knee_valgus": {
                "name": "膝盖内扣",
                "description": "膝盖向中线靠拢，可能导致膝盖受伤",
                "check_func": "check_knee_valgus",
                "correction": "保持膝盖与脚尖方向一致，向外打开"
            },
            "knee_over_toe": {
                "name": "膝盖超过脚尖",
                "description": "膝盖向前移动过多，增加膝盖压力",
                "check_func": "check_knee_over_toe",
                "correction": "臀部向后坐，像坐在椅子上"
            },
            "back_rounding": {
                "name": "背部弯曲",
                "description": "上半身向前弯曲过多，脊柱不直",
                "check_func": "check_back_rounding",
                "correction": "保持背部挺直，核心收紧"
            },
            "depth_insufficient": {
                "name": "下蹲深度不足",
                "description": "膝盖弯曲角度不够，未达到标准深蹲深度",
                "check_func": "check_depth_insufficient",
                "correction": "继续下蹲，直到大腿与地面平行"
            }
        }
    },
    "pushup": {
        "name": "俯卧撑",
        "description": "标准俯卧撑动作",
        "key_angles": {
            "left_elbow": {"min": 90, "max": 160, "ideal": 120},
            "right_elbow": {"min": 90, "max": 160, "ideal": 120},
            "left_shoulder": {"min": 80, "max": 120, "ideal": 100},
            "right_shoulder": {"min": 80, "max": 120, "ideal": 100},
            "left_hip": {"min": 160, "max": 180, "ideal": 180},
            "right_hip": {"min": 160, "max": 180, "ideal": 180}
        },
        "common_errors": {
            "hip_sagging": {
                "name": "臀部下垂",
                "description": "臀部低于身体直线，核心力量不足",
                "check_func": "check_hip_sagging",
                "correction": "收紧核心，保持身体成一条直线"
            },
            "elbow_flaring": {
                "name": "肘部外展",
                "description": "肘部向外打开角度过大",
                "check_func": "check_elbow_flaring",
                "correction": "肘部贴近身体，约45度角"
            },
            "range_insufficient": {
                "name": "动作幅度不足",
                "description": "肘部弯曲角度不够",
                "check_func": "check_pushup_range",
                "correction": "向下时胸部接近地面"
            }
        }
    },
    "plank": {
        "name": "平板支撑",
        "description": "标准平板支撑动作",
        "key_angles": {
            "left_shoulder": {"min": 80, "max": 100, "ideal": 90},
            "right_shoulder": {"min": 80, "max": 100, "ideal": 90},
            "left_hip": {"min": 160, "max": 180, "ideal": 180},
            "right_hip": {"min": 160, "max": 180, "ideal": 180},
            "left_knee": {"min": 160, "max": 180, "ideal": 180},
            "right_knee": {"min": 160, "max": 180, "ideal": 180}
        },
        "common_errors": {
            "hip_sagging": {
                "name": "臀部下垂",
                "description": "臀部低于身体直线",
                "check_func": "check_hip_sagging",
                "correction": "收紧核心，保持身体成一条直线"
            },
            "hip_rising": {
                "name": "臀部过高",
                "description": "臀部高于身体直线",
                "check_func": "check_hip_rising",
                "correction": "降低臀部，保持身体成一条直线"
            },
            "shoulder_misalignment": {
                "name": "肩部错位",
                "description": "肩部没有在手腕正上方",
                "check_func": "check_shoulder_misalignment",
                "correction": "保持肩部在手腕正上方"
            }
        }
    }
}


def get_keypoint(keypoints, name):
    for kp in keypoints:
        if kp.get('name') == name:
            return kp
    return None


def check_knee_valgus(keypoints):
    left_knee = get_keypoint(keypoints, 'left_knee')
    right_knee = get_keypoint(keypoints, 'right_knee')
    left_hip = get_keypoint(keypoints, 'left_hip')
    right_hip = get_keypoint(keypoints, 'right_hip')
    
    if not all([left_knee, right_knee, left_hip, right_hip]):
        return False
    
    min_score = 0.4
    if (left_knee.get('score', 0) < min_score or 
        right_knee.get('score', 0) < min_score or
        left_hip.get('score', 0) < min_score or 
        right_hip.get('score', 0) < min_score):
        return False
    
    hip_width = abs(right_hip['x'] - left_hip['x'])
    knee_distance = abs(right_knee['x'] - left_knee['x'])
    
    if knee_distance < hip_width * 0.7:
        return True
    return False


def check_knee_over_toe(keypoints):
    left_knee = get_keypoint(keypoints, 'left_knee')
    right_knee = get_keypoint(keypoints, 'right_knee')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    right_ankle = get_keypoint(keypoints, 'right_ankle')
    
    if not all([left_knee, right_knee, left_ankle, right_ankle]):
        return False
    
    if left_knee['x'] > left_ankle['x'] or right_knee['x'] < right_ankle['x']:
        return True
    return False


def check_back_rounding(keypoints):
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    right_shoulder = get_keypoint(keypoints, 'right_shoulder')
    left_hip = get_keypoint(keypoints, 'left_hip')
    right_hip = get_keypoint(keypoints, 'right_hip')
    nose = get_keypoint(keypoints, 'nose')
    
    if not all([left_shoulder, right_shoulder, left_hip, right_hip, nose]):
        return False
    
    shoulder_y = (left_shoulder['y'] + right_shoulder['y']) / 2
    hip_y = (left_hip['y'] + right_hip['y']) / 2
    
    if abs(nose['y'] - shoulder_y) > abs(shoulder_y - hip_y) * 0.3:
        return True
    return False


def check_depth_insufficient(angles):
    left_knee = angles.get('left_knee', 180)
    right_knee = angles.get('right_knee', 180)
    
    if left_knee > 140 and right_knee > 140:
        return True
    return False


def check_hip_sagging(keypoints):
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    right_shoulder = get_keypoint(keypoints, 'right_shoulder')
    left_hip = get_keypoint(keypoints, 'left_hip')
    right_hip = get_keypoint(keypoints, 'right_hip')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    right_ankle = get_keypoint(keypoints, 'right_ankle')
    
    if not all([left_shoulder, right_shoulder, left_hip, right_hip, left_ankle, right_ankle]):
        return False
    
    shoulder_y = (left_shoulder['y'] + right_shoulder['y']) / 2
    hip_y = (left_hip['y'] + right_hip['y']) / 2
    ankle_y = (left_ankle['y'] + right_ankle['y']) / 2
    
    body_height = abs(shoulder_y - ankle_y)
    if hip_y > shoulder_y + body_height * 0.1:
        return True
    return False


def check_hip_rising(keypoints):
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    right_shoulder = get_keypoint(keypoints, 'right_shoulder')
    left_hip = get_keypoint(keypoints, 'left_hip')
    right_hip = get_keypoint(keypoints, 'right_hip')
    left_ankle = get_keypoint(keypoints, 'left_ankle')
    right_ankle = get_keypoint(keypoints, 'right_ankle')
    
    if not all([left_shoulder, right_shoulder, left_hip, right_hip, left_ankle, right_ankle]):
        return False
    
    shoulder_y = (left_shoulder['y'] + right_shoulder['y']) / 2
    hip_y = (left_hip['y'] + right_hip['y']) / 2
    ankle_y = (left_ankle['y'] + right_ankle['y']) / 2
    
    body_height = abs(shoulder_y - ankle_y)
    if hip_y < shoulder_y - body_height * 0.1:
        return True
    return False


def check_shoulder_misalignment(keypoints):
    left_shoulder = get_keypoint(keypoints, 'left_shoulder')
    right_shoulder = get_keypoint(keypoints, 'right_shoulder')
    left_wrist = get_keypoint(keypoints, 'left_wrist')
    right_wrist = get_keypoint(keypoints, 'right_wrist')
    
    if not all([left_shoulder, right_shoulder, left_wrist, right_wrist]):
        return False
    
    shoulder_x = (left_shoulder['x'] + right_shoulder['x']) / 2
    wrist_x = (left_wrist['x'] + right_wrist['x']) / 2
    
    if abs(shoulder_x - wrist_x) > 0.1:
        return True
    return False


def check_elbow_flaring(angles):
    left_elbow = angles.get('left_elbow', 90)
    right_elbow = angles.get('right_elbow', 90)
    
    if left_elbow > 160 or right_elbow > 160:
        return False
    
    return False


def check_pushup_range(angles):
    left_elbow = angles.get('left_elbow', 180)
    right_elbow = angles.get('right_elbow', 180)
    
    if left_elbow > 150 and right_elbow > 150:
        return True
    return False


def check_rate_limit():
    global request_times
    with request_lock:
        now = time.time()
        request_times = [t for t in request_times if now - t < 1.0]
        
        if len(request_times) >= MAX_REQUESTS_PER_SECOND:
            return False
        
        request_times.append(now)
        return True


ERROR_CHECK_FUNCTIONS = {
    'check_knee_valgus': check_knee_valgus,
    'check_knee_over_toe': check_knee_over_toe,
    'check_back_rounding': check_back_rounding,
    'check_depth_insufficient': check_depth_insufficient,
    'check_hip_sagging': check_hip_sagging,
    'check_hip_rising': check_hip_rising,
    'check_shoulder_misalignment': check_shoulder_misalignment,
    'check_elbow_flaring': check_elbow_flaring,
    'check_pushup_range': check_pushup_range
}


def generate_cache_key(pose_id, keypoints, angles):
    try:
        simple_keypoints = []
        for kp in keypoints[:10]:
            simple_keypoints.append({
                'name': kp.get('name', ''),
                'x': round(kp.get('x', 0), 1),
                'y': round(kp.get('y', 0), 1)
            })
        
        simple_angles = {}
        for k, v in list(angles.items())[:8]:
            simple_angles[k] = round(v, -1)
        
        key_parts = [
            pose_id,
            json.dumps(simple_keypoints, sort_keys=True),
            json.dumps(simple_angles, sort_keys=True)
        ]
        return '|'.join(key_parts)
    except:
        return None


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'cache_size': len(analysis_cache.cache),
        'version': '2.0'
    })


@app.route('/api/poses', methods=['GET'])
@lru_cache(maxsize=1)
def get_all_poses():
    poses_info = {}
    for pose_id, pose_data in STANDARD_POSES.items():
        poses_info[pose_id] = {
            'name': pose_data['name'],
            'description': pose_data['description']
        }
    return jsonify(poses_info)


@app.route('/api/poses/<pose_id>', methods=['GET'])
def get_pose_details(pose_id):
    if pose_id not in STANDARD_POSES:
        return jsonify({'error': 'Pose not found'}), 404
    
    pose = STANDARD_POSES[pose_id]
    errors_info = {}
    for error_id, error_data in pose['common_errors'].items():
        errors_info[error_id] = {
            'name': error_data['name'],
            'description': error_data['description'],
            'correction': error_data['correction']
        }
    
    return jsonify({
        'name': pose['name'],
        'description': pose['description'],
        'key_angles': pose['key_angles'],
        'common_errors': errors_info
    })


@app.route('/api/analyze/<pose_id>', methods=['POST'])
def analyze_pose(pose_id):
    start_time = time.time()
    
    if not check_rate_limit():
        return jsonify({
            'error': 'Too many requests',
            'message': '请求频率过高，请稍后再试'
        }), 429
    
    if pose_id not in STANDARD_POSES:
        return jsonify({'error': 'Pose not found'}), 404
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400
        
        keypoints = data.get('keypoints', [])
        angles = data.get('angles', {})
        
        if not keypoints or not angles:
            return jsonify({'error': 'Missing required fields'}), 400
        
        cache_key = generate_cache_key(pose_id, keypoints, angles)
        if cache_key:
            cached_result = analysis_cache.get(cache_key)
            if cached_result:
                return jsonify(cached_result)
        
        pose = STANDARD_POSES[pose_id]
        
        detected_errors = []
        angle_comparisons = {}
        
        for angle_name, angle_value in angles.items():
            if angle_name in pose['key_angles']:
                standard = pose['key_angles'][angle_name]
                is_acceptable = standard['min'] <= angle_value <= standard['max']
                angle_comparisons[angle_name] = {
                    'current': angle_value,
                    'standard_min': standard['min'],
                    'standard_max': standard['max'],
                    'ideal': standard['ideal'],
                    'is_acceptable': is_acceptable,
                    'deviation': angle_value - standard['ideal']
                }
        
        for error_id, error_data in pose['common_errors'].items():
            try:
                check_func_name = error_data.get('check_func')
                if check_func_name and check_func_name in ERROR_CHECK_FUNCTIONS:
                    check_func = ERROR_CHECK_FUNCTIONS[check_func_name]
                    
                    if 'depth' in check_func_name or 'elbow' in check_func_name or 'pushup' in check_func_name:
                        result = check_func(angles)
                    else:
                        result = check_func(keypoints)
                    
                    if result:
                        detected_errors.append({
                            'id': error_id,
                            'name': error_data['name'],
                            'description': error_data['description'],
                            'correction': error_data['correction']
                        })
            except Exception as e:
                app.logger.warning(f"Error checking {error_id}: {e}")
                continue
        
        overall_score = calculate_overall_score(angle_comparisons, detected_errors)
        
        result = {
            'pose_id': pose_id,
            'pose_name': pose['name'],
            'angle_comparisons': angle_comparisons,
            'detected_errors': detected_errors,
            'overall_score': overall_score,
            'timestamp': data.get('timestamp'),
            'processing_time_ms': round((time.time() - start_time) * 1000, 2)
        }
        
        if cache_key:
            analysis_cache.set(cache_key, result)
        
        return jsonify(result)
        
    except Exception as e:
        app.logger.error(f"Analysis error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


def calculate_overall_score(angle_comparisons, detected_errors):
    if not angle_comparisons:
        return 0
    
    total_deviation = 0
    valid_angles = 0
    
    for angle_name, comparison in angle_comparisons.items():
        if comparison['is_acceptable']:
            ideal_range = comparison['standard_max'] - comparison['standard_min']
            if ideal_range > 0:
                deviation_ratio = abs(comparison['deviation']) / ideal_range
                total_deviation += deviation_ratio
                valid_angles += 1
    
    if valid_angles == 0:
        return 0
    
    angle_score = max(0, 100 - (total_deviation / valid_angles) * 100)
    error_penalty = len(detected_errors) * 15
    
    return max(0, min(100, angle_score - error_penalty))


@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


def get_user_level(user_id=DEFAULT_USER_ID):
    with history_lock:
        history = training_history.get(user_id, [])
        
        if not history:
            return 'beginner'
        
        recent_sessions = history[-10:] if len(history) > 10 else history
        
        total_score = 0
        count = 0
        for session in recent_sessions:
            if session.get('average_score', 0) > 0:
                total_score += session['average_score']
                count += 1
        
        if count == 0:
            return 'beginner'
        
        avg_score = total_score / count
        
        for level_id, level_data in TRAINING_LEVELS.items():
            if level_data['min_score'] <= avg_score < level_data['max_score']:
                return level_id
        
        return 'advanced'


def analyze_weak_points(user_id=DEFAULT_USER_ID):
    with history_lock:
        history = training_history.get(user_id, [])
        
        if not history:
            return {}
        
        pose_stats = defaultdict(lambda: {'total_score': 0, 'count': 0, 'errors': []})
        
        for session in history[-20:]:
            for exercise in session.get('exercises', []):
                pose_id = exercise.get('pose_id')
                if pose_id:
                    score = exercise.get('average_score', 0)
                    if score > 0:
                        pose_stats[pose_id]['total_score'] += score
                        pose_stats[pose_id]['count'] += 1
                    
                    errors = exercise.get('common_errors', [])
                    pose_stats[pose_id]['errors'].extend(errors)
        
        weak_points = {}
        for pose_id, stats in pose_stats.items():
            if stats['count'] > 0:
                avg_score = stats['total_score'] / stats['count']
                if avg_score < 70:
                    weak_points[pose_id] = {
                        'average_score': round(avg_score, 1),
                        'session_count': stats['count'],
                        'common_errors': list(set(stats['errors']))[:3]
                    }
        
        return weak_points


def generate_daily_plan(user_id=DEFAULT_USER_ID, target_date=None):
    if target_date is None:
        target_date = datetime.now().date()
    
    day_of_week = target_date.weekday()
    workout_type = WEEKLY_SCHEDULE[day_of_week]
    
    user_level = get_user_level(user_id)
    level_data = TRAINING_LEVELS[user_level]
    weak_points = analyze_weak_points(user_id)
    
    if workout_type == 'rest':
        return {
            'date': target_date.isoformat(),
            'day_of_week': day_of_week,
            'workout_type': 'rest',
            'is_rest_day': True,
            'message': '今天是休息日，建议进行轻度拉伸或散步',
            'exercises': []
        }
    
    template = WORKOUT_TEMPLATES.get(workout_type, WORKOUT_TEMPLATES['full_body'])
    
    exercises = []
    for i, exercise_template in enumerate(template):
        pose_id = exercise_template['pose_id']
        
        is_weak_point = pose_id in weak_points
        
        sets = level_data['sets']
        reps = level_data['reps']
        
        if is_weak_point:
            sets = max(2, sets - 1)
            reps = max(6, reps - 2)
        
        pose_info = STANDARD_POSES.get(pose_id, {})
        
        exercise = {
            'exercise_id': f"{pose_id}_{i}",
            'pose_id': pose_id,
            'pose_name': pose_info.get('name', pose_id),
            'focus': exercise_template['focus'],
            'sets': sets,
            'reps': reps,
            'is_weak_point': is_weak_point,
            'rest_seconds': 60,
            'tips': []
        }
        
        if is_weak_point:
            exercise['tips'].append('这是您的薄弱项，请注意动作标准性')
            weak_data = weak_points.get(pose_id, {})
            for error in weak_data.get('common_errors', []):
                exercise['tips'].append(f"注意避免: {error}")
        
        exercises.append(exercise)
    
    warm_up = {
        'type': 'warm_up',
        'duration_minutes': 5,
        'description': '关节环绕、轻度动态拉伸'
    }
    
    cool_down = {
        'type': 'cool_down',
        'duration_minutes': 5,
        'description': '静态拉伸、深呼吸放松'
    }
    
    total_minutes = 5 + len(exercises) * 3 + 5
    
    return {
        'date': target_date.isoformat(),
        'day_of_week': day_of_week,
        'workout_type': workout_type,
        'is_rest_day': False,
        'user_level': user_level,
        'level_name': level_data['name'],
        'warm_up': warm_up,
        'exercises': exercises,
        'cool_down': cool_down,
        'total_duration_minutes': total_minutes,
        'weak_points_identified': list(weak_points.keys())
    }


def generate_weekly_plan(user_id=DEFAULT_USER_ID, start_date=None):
    if start_date is None:
        today = datetime.now().date()
        start_date = today - timedelta(days=today.weekday())
    
    weekly_plan = []
    weak_points = analyze_weak_points(user_id)
    
    for i in range(7):
        plan_date = start_date + timedelta(days=i)
        daily_plan = generate_daily_plan(user_id, plan_date)
        weekly_plan.append(daily_plan)
    
    return {
        'start_date': start_date.isoformat(),
        'end_date': (start_date + timedelta(days=6)).isoformat(),
        'weak_points': weak_points,
        'user_level': get_user_level(user_id),
        'daily_plans': weekly_plan
    }


@app.route('/api/training/history', methods=['POST'])
def upload_training_history():
    start_time = time.time()
    
    if not check_rate_limit():
        return jsonify({
            'error': 'Too many requests',
            'message': '请求频率过高，请稍后再试'
        }), 429
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400
        
        user_id = data.get('user_id', DEFAULT_USER_ID)
        session_date = data.get('session_date', datetime.now().isoformat())
        
        session = {
            'session_id': data.get('session_id', f"session_{int(time.time())}"),
            'session_date': session_date,
            'duration_seconds': data.get('duration_seconds', 0),
            'exercises': data.get('exercises', []),
            'average_score': data.get('average_score', 0),
            'total_reps': data.get('total_reps', 0),
            'errors_detected': data.get('errors_detected', [])
        }
        
        with history_lock:
            training_history[user_id].append(session)
        
        if len(session.get('exercises', [])) > 0:
            today = datetime.now().date()
            tomorrow = today + timedelta(days=1)
            
            with plan_lock:
                tomorrow_plan = generate_daily_plan(user_id, tomorrow)
                training_plans[(user_id, tomorrow.isoformat())] = tomorrow_plan
        
        return jsonify({
            'status': 'success',
            'message': '训练记录已保存',
            'session_id': session['session_id'],
            'processing_time_ms': round((time.time() - start_time) * 1000, 2)
        })
        
    except Exception as e:
        app.logger.error(f"Upload history error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/training/history', methods=['GET'])
def get_training_history():
    try:
        user_id = request.args.get('user_id', DEFAULT_USER_ID)
        limit = int(request.args.get('limit', 20))
        
        with history_lock:
            history = training_history.get(user_id, [])
            recent_history = history[-limit:] if len(history) > limit else history
        
        return jsonify({
            'user_id': user_id,
            'total_sessions': len(history),
            'sessions': recent_history
        })
        
    except Exception as e:
        app.logger.error(f"Get history error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/training/plan/today', methods=['GET'])
def get_today_plan():
    try:
        user_id = request.args.get('user_id', DEFAULT_USER_ID)
        today = datetime.now().date()
        
        with plan_lock:
            cache_key = (user_id, today.isoformat())
            if cache_key in training_plans:
                plan = training_plans[cache_key]
            else:
                plan = generate_daily_plan(user_id, today)
                training_plans[cache_key] = plan
        
        return jsonify(plan)
        
    except Exception as e:
        app.logger.error(f"Get today plan error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/training/plan/tomorrow', methods=['GET'])
def get_tomorrow_plan():
    try:
        user_id = request.args.get('user_id', DEFAULT_USER_ID)
        tomorrow = datetime.now().date() + timedelta(days=1)
        
        with plan_lock:
            cache_key = (user_id, tomorrow.isoformat())
            if cache_key in training_plans:
                plan = training_plans[cache_key]
            else:
                plan = generate_daily_plan(user_id, tomorrow)
                training_plans[cache_key] = plan
        
        return jsonify(plan)
        
    except Exception as e:
        app.logger.error(f"Get tomorrow plan error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/training/plan/weekly', methods=['GET'])
def get_weekly_plan():
    try:
        user_id = request.args.get('user_id', DEFAULT_USER_ID)
        
        plan = generate_weekly_plan(user_id)
        
        return jsonify(plan)
        
    except Exception as e:
        app.logger.error(f"Get weekly plan error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/training/stats', methods=['GET'])
def get_training_stats():
    try:
        user_id = request.args.get('user_id', DEFAULT_USER_ID)
        
        with history_lock:
            history = training_history.get(user_id, [])
        
        if not history:
            return jsonify({
                'user_id': user_id,
                'total_sessions': 0,
                'message': '暂无训练数据'
            })
        
        total_sessions = len(history)
        total_duration = sum(s.get('duration_seconds', 0) for s in history)
        total_reps = sum(s.get('total_reps', 0) for s in history)
        
        scores = [s.get('average_score', 0) for s in history if s.get('average_score', 0) > 0]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        recent_7 = history[-7:] if len(history) >= 7 else history
        recent_scores = [s.get('average_score', 0) for s in recent_7 if s.get('average_score', 0) > 0]
        recent_avg = sum(recent_scores) / len(recent_scores) if recent_scores else 0
        
        improvement = recent_avg - avg_score if len(scores) > len(recent_scores) else 0
        
        user_level = get_user_level(user_id)
        weak_points = analyze_weak_points(user_id)
        
        return jsonify({
            'user_id': user_id,
            'total_sessions': total_sessions,
            'total_duration_minutes': round(total_duration / 60, 1),
            'total_reps': total_reps,
            'average_score_all_time': round(avg_score, 1),
            'average_score_recent_7': round(recent_avg, 1),
            'improvement_trend': round(improvement, 1),
            'user_level': user_level,
            'level_name': TRAINING_LEVELS[user_level]['name'],
            'weak_points': weak_points
        })
        
    except Exception as e:
        app.logger.error(f"Get stats error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/training/plan/generate', methods=['POST'])
def generate_custom_plan():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', DEFAULT_USER_ID)
        focus_area = data.get('focus_area')
        
        if focus_area and focus_area in WORKOUT_TEMPLATES:
            today = datetime.now().date()
            user_level = get_user_level(user_id)
            level_data = TRAINING_LEVELS[user_level]
            weak_points = analyze_weak_points(user_id)
            
            template = WORKOUT_TEMPLATES[focus_area]
            exercises = []
            
            for i, exercise_template in enumerate(template):
                pose_id = exercise_template['pose_id']
                is_weak_point = pose_id in weak_points
                
                sets = level_data['sets']
                reps = level_data['reps']
                
                if is_weak_point:
                    sets = max(2, sets - 1)
                    reps = max(6, reps - 2)
                
                pose_info = STANDARD_POSES.get(pose_id, {})
                
                exercises.append({
                    'exercise_id': f"{pose_id}_{i}",
                    'pose_id': pose_id,
                    'pose_name': pose_info.get('name', pose_id),
                    'focus': exercise_template['focus'],
                    'sets': sets,
                    'reps': reps,
                    'is_weak_point': is_weak_point,
                    'rest_seconds': 60
                })
            
            plan = {
                'date': today.isoformat(),
                'workout_type': focus_area,
                'is_rest_day': False,
                'user_level': user_level,
                'level_name': level_data['name'],
                'exercises': exercises,
                'is_custom': True
            }
            
            return jsonify(plan)
        
        return jsonify({
            'error': 'Invalid focus area',
            'available_options': list(WORKOUT_TEMPLATES.keys())
        }), 400
        
    except Exception as e:
        app.logger.error(f"Generate custom plan error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.INFO)
    
    app.logger.info("Starting Fitness Pose Analysis API v2.0")
    app.logger.info(f"Rate limit: {MAX_REQUESTS_PER_SECOND} req/sec")
    app.logger.info(f"Request timeout: {REQUEST_TIMEOUT}s")
    app.logger.info(f"Cache TTL: {CACHE_TTL}s")
    
    app.run(
        debug=False,
        host='0.0.0.0',
        port=5000,
        threaded=True,
        processes=1
    )
