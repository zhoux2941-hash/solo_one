import numpy as np
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass
from ..models.schemas import Point3D, Vector3D, TrajectoryPoint, ProbabilityCone, EnvironmentParameters

@dataclass
class WeaponParams:
    initial_velocity_min: float
    initial_velocity_max: float
    bullet_mass: float
    drag_coefficient: float
    bullet_diameter: float

@dataclass
class EnvironmentParams:
    temperature: float
    altitude: float
    humidity: float
    pressure: Optional[float] = None
    air_density: Optional[float] = None

@dataclass
class BallisticPoint:
    position: np.ndarray
    velocity: np.ndarray
    time: float

class AirDensityCalculator:
    """
    空气密度计算器
    根据温度、海拔、湿度计算空气密度
    """
    
    STANDARD_AIR_DENSITY = 1.225
    STANDARD_TEMPERATURE = 288.15
    STANDARD_PRESSURE = 101325.0
    GAS_CONSTANT_DRY_AIR = 287.0
    GAS_CONSTANT_WATER_VAPOR = 461.5
    TEMPERATURE_LAPSE_RATE = 0.0065
    GRAVITATIONAL_ACCELERATION = 9.80665
    MOLAR_MASS_AIR = 0.0289644
    UNIVERSAL_GAS_CONSTANT = 8.31432
    
    @classmethod
    def calculate_air_density(cls, env_params: EnvironmentParams) -> float:
        """
        根据环境参数计算空气密度
        
        公式:
        ρ = P / (R_specific * T)
        
        考虑湿度时:
        ρ = (P_d / (R_d * T)) + (P_v / (R_v * T))
        
        其中:
        - P_d: 干燥空气分压
        - P_v: 水蒸气分压
        - R_d: 干燥空气气体常数 (287 J/(kg·K))
        - R_v: 水蒸气气体常数 (461.5 J/(kg·K))
        """
        temperature_k = env_params.temperature + 273.15
        
        if env_params.pressure is not None:
            pressure = env_params.pressure
        else:
            pressure = cls.calculate_pressure_from_altitude(
                env_params.altitude,
                env_params.temperature
            )
        
        if env_params.humidity > 0:
            saturation_pressure = cls.calculate_saturation_vapor_pressure(env_params.temperature)
            actual_vapor_pressure = saturation_pressure * (env_params.humidity / 100.0)
            
            dry_air_pressure = pressure - actual_vapor_pressure
            
            density_dry = dry_air_pressure / (cls.GAS_CONSTANT_DRY_AIR * temperature_k)
            density_vapor = actual_vapor_pressure / (cls.GAS_CONSTANT_WATER_VAPOR * temperature_k)
            
            total_density = density_dry + density_vapor
        else:
            total_density = pressure / (cls.GAS_CONSTANT_DRY_AIR * temperature_k)
        
        return total_density
    
    @classmethod
    def calculate_pressure_from_altitude(cls, 
                                           altitude: float, 
                                           temperature: float = 15.0) -> float:
        """
        根据海拔计算大气压
        使用国际标准大气模型 (ISA)
        
        公式: P = P0 * (1 - (L * h) / T0) ^ ((g * M) / (R * L))
        
        其中:
        - P0: 标准海平面气压 (101325 Pa)
        - L: 温度递减率 (0.0065 K/m)
        - h: 海拔高度 (m)
        - T0: 标准海平面温度 (288.15 K = 15°C)
        - g: 重力加速度 (9.80665 m/s²)
        - M: 空气摩尔质量 (0.0289644 kg/mol)
        - R: 通用气体常数 (8.31432 J/(mol·K))
        """
        if altitude <= 11000:
            temperature_k = cls.STANDARD_TEMPERATURE
            exponent = (cls.GRAVITATIONAL_ACCELERATION * cls.MOLAR_MASS_AIR) / \
                      (cls.UNIVERSAL_GAS_CONSTANT * cls.TEMPERATURE_LAPSE_RATE)
            
            pressure = cls.STANDARD_PRESSURE * \
                      (1 - (cls.TEMPERATURE_LAPSE_RATE * altitude) / temperature_k) ** exponent
        else:
            base_temperature = 216.65
            base_pressure = 22632.06
            base_altitude = 11000
            
            exponent = (cls.GRAVITATIONAL_ACCELERATION * cls.MOLAR_MASS_AIR) / \
                      (cls.UNIVERSAL_GAS_CONSTANT * base_temperature)
            
            pressure = base_pressure * np.exp(
                -exponent * (altitude - base_altitude) / base_temperature
            )
        
        return pressure
    
    @classmethod
    def calculate_saturation_vapor_pressure(cls, temperature_c: float) -> float:
        """
        计算饱和水蒸气压力
        使用 Tetens 方程
        
        公式: e_s = 0.61078 * exp((17.27 * T) / (T + 237.3))
        
        其中 T 是摄氏度，结果单位是 kPa
        """
        if temperature_c >= 0:
            a = 17.27
            b = 237.3
        else:
            a = 21.87
            b = 265.5
        
        saturation_pressure_kpa = 0.61078 * np.exp(
            (a * temperature_c) / (temperature_c + b)
        )
        
        return saturation_pressure_kpa * 1000
    
    @classmethod
    def get_air_density_at_height(cls, 
                                    base_env: EnvironmentParams,
                                    height: float) -> float:
        """
        计算指定高度处的空气密度
        用于长距离弹道计算时的密度变化
        """
        relative_height = height - base_env.altitude
        
        temperature_at_height = base_env.temperature - cls.TEMPERATURE_LAPSE_RATE * relative_height
        
        env_at_height = EnvironmentParams(
            temperature=temperature_at_height,
            altitude=height,
            humidity=base_env.humidity,
            pressure=None
        )
        
        return cls.calculate_air_density(env_at_height)


class BallisticCalculator:
    GRAVITY = np.array([0.0, 0.0, -9.81])
    DEFAULT_AIR_DENSITY = 1.225
    TIME_STEP = 0.001
    
    def __init__(self):
        self.air_density_calculator = AirDensityCalculator()
    
    def calculate_drag_force(self, 
                              velocity: np.ndarray, 
                              params: WeaponParams,
                              air_density: float) -> np.ndarray:
        """
        计算空气阻力
        使用动态空气密度
        """
        speed = np.linalg.norm(velocity)
        if speed < 1e-10:
            return np.zeros(3)
        
        area = np.pi * (params.bullet_diameter / 2) ** 2
        drag_magnitude = 0.5 * air_density * speed ** 2 * params.drag_coefficient * area
        
        drag_direction = -velocity / speed
        return drag_magnitude * drag_direction
    
    def calculate_acceleration(self, 
                               velocity: np.ndarray,
                               params: WeaponParams,
                               air_density: float,
                               position_z: float = 0.0,
                               base_env: Optional[EnvironmentParams] = None) -> np.ndarray:
        """
        计算加速度（重力 + 空气阻力）
        支持根据位置动态调整空气密度
        """
        mass_kg = params.bullet_mass / 1000.0
        
        if base_env is not None:
            current_air_density = self.air_density_calculator.get_air_density_at_height(
                base_env, position_z
            )
        else:
            current_air_density = air_density
        
        drag_force = self.calculate_drag_force(velocity, params, current_air_density)
        drag_acceleration = drag_force / mass_kg
        
        return self.GRAVITY + drag_acceleration
    
    def integrate_trajectory(self, 
                              start_pos: np.ndarray,
                              start_vel: np.ndarray,
                              params: WeaponParams,
                              air_density: float,
                              max_time: float = 10.0,
                              base_env: Optional[EnvironmentParams] = None) -> List[BallisticPoint]:
        """
        使用四阶龙格-库塔法积分弹道轨迹
        支持动态空气密度
        """
        trajectory = []
        
        pos = start_pos.copy()
        vel = start_vel.copy()
        time = 0.0
        
        trajectory.append(BallisticPoint(
            position=pos.copy(),
            velocity=vel.copy(),
            time=time
        ))
        
        while time < max_time:
            k1_vel = self.calculate_acceleration(
                vel, params, air_density, pos[2], base_env
            )
            k1_pos = vel
            
            k2_vel = self.calculate_acceleration(
                vel + 0.5 * self.TIME_STEP * k1_vel,
                params, air_density, 
                pos[2] + 0.5 * self.TIME_STEP * k1_pos[2],
                base_env
            )
            k2_pos = vel + 0.5 * self.TIME_STEP * k1_vel
            
            k3_vel = self.calculate_acceleration(
                vel + 0.5 * self.TIME_STEP * k2_vel,
                params, air_density,
                pos[2] + 0.5 * self.TIME_STEP * k2_pos[2],
                base_env
            )
            k3_pos = vel + 0.5 * self.TIME_STEP * k2_vel
            
            k4_vel = self.calculate_acceleration(
                vel + self.TIME_STEP * k3_vel,
                params, air_density,
                pos[2] + self.TIME_STEP * k3_pos[2],
                base_env
            )
            k4_pos = vel + self.TIME_STEP * k3_vel
            
            pos += (self.TIME_STEP / 6.0) * (k1_pos + 2*k2_pos + 2*k3_pos + k4_pos)
            vel += (self.TIME_STEP / 6.0) * (k1_vel + 2*k2_vel + 2*k3_vel + k4_vel)
            time += self.TIME_STEP
            
            if time % 0.01 < self.TIME_STEP:
                trajectory.append(BallisticPoint(
                    position=pos.copy(),
                    velocity=vel.copy(),
                    time=time
                ))
            
            if np.linalg.norm(vel) < 1.0:
                break
            
            if pos[2] < -100:
                break
        
        return trajectory
    
    def calculate_trajectory_from_two_points(self,
                                              point1: np.ndarray,
                                              point2: np.ndarray,
                                              params: WeaponParams,
                                              air_density: float,
                                              time_guess: Optional[float] = None,
                                              base_env: Optional[EnvironmentParams] = None) -> Optional[Dict]:
        """
        根据两个弹孔点计算弹道轨迹
        使用反向溯源法
        """
        direction = point2 - point1
        distance = np.linalg.norm(direction)
        direction_norm = direction / (distance + 1e-8)
        
        if time_guess is None:
            avg_velocity = (params.initial_velocity_min + params.initial_velocity_max) / 2
            time_guess = distance / avg_velocity
        
        best_trajectory = None
        best_error = float('inf')
        
        for vel_mag in np.linspace(params.initial_velocity_min, params.initial_velocity_max, 20):
            initial_vel = direction_norm * vel_mag
            
            trajectory = self.integrate_trajectory(
                point1, initial_vel, params, air_density, time_guess * 2, base_env
            )
            
            final_pos = trajectory[-1].position
            error = np.linalg.norm(final_pos - point2)
            
            if error < best_error:
                best_error = error
                best_trajectory = {
                    'trajectory': trajectory,
                    'initial_velocity': vel_mag,
                    'initial_direction': direction_norm,
                    'error': error
                }
        
        return best_trajectory
    
    def backtrack_trajectory(self,
                              end_point: np.ndarray,
                              end_direction: np.ndarray,
                              params: WeaponParams,
                              air_density: float,
                              backtrack_time: float = 5.0,
                              base_env: Optional[EnvironmentParams] = None) -> List[BallisticPoint]:
        """
        反向溯源：从弹孔位置反推射手位置
        """
        end_direction_norm = end_direction / (np.linalg.norm(end_direction) + 1e-8)
        
        class ReverseParams:
            def __init__(self, params):
                self.initial_velocity_min = params.initial_velocity_min
                self.initial_velocity_max = params.initial_velocity_max
                self.bullet_mass = params.bullet_mass
                self.drag_coefficient = params.drag_coefficient
                self.bullet_diameter = params.bullet_diameter
        
        reverse_params = ReverseParams(params)
        
        trajectories = []
        for vel_mag in np.linspace(params.initial_velocity_min, params.initial_velocity_max, 10):
            initial_vel = -end_direction_norm * vel_mag
            
            traj = self.integrate_trajectory(
                end_point, initial_vel, reverse_params, air_density, backtrack_time, base_env
            )
            trajectories.append(traj)
        
        return trajectories[0] if trajectories else []
    
    def calculate_probability_cone(self,
                                    bullet_holes: List[Dict],
                                    params: WeaponParams) -> Optional[ProbabilityCone]:
        """
        计算可能的射手位置区域（锥形概率云）
        """
        if len(bullet_holes) < 2:
            return None
        
        points = [np.array([bh['position'].x, bh['position'].y, bh['position'].z]) 
                  for bh in bullet_holes]
        
        directions = []
        for i in range(len(points) - 1):
            dir_vec = points[i+1] - points[i]
            if np.linalg.norm(dir_vec) > 1e-8:
                directions.append(dir_vec / np.linalg.norm(dir_vec))
        
        if not directions:
            return None
        
        avg_direction = np.mean(directions, axis=0)
        avg_direction = avg_direction / (np.linalg.norm(avg_direction) + 1e-8)
        
        if len(directions) > 1:
            angle_variance = 0.0
            for d in directions:
                angle = np.arccos(np.clip(np.dot(d, avg_direction), -1.0, 1.0))
                angle_variance += angle ** 2
            angle_variance /= len(directions)
            cone_angle = np.sqrt(angle_variance) * 3
        else:
            cone_angle = np.radians(15)
        
        avg_velocity = (params.initial_velocity_min + params.initial_velocity_max) / 2
        cone_height = avg_velocity * 3.0
        
        apex_point = points[0] - avg_direction * 1.0
        
        return ProbabilityCone(
            apex=Point3D(x=float(apex_point[0]), y=float(apex_point[1]), z=float(apex_point[2])),
            direction=Vector3D(x=float(avg_direction[0]), y=float(avg_direction[1]), z=float(avg_direction[2])),
            angle=float(cone_angle),
            height=float(cone_height),
            confidence=0.8
        )
    
    def analyze_shooter_position(self,
                                  bullet_holes: List[Dict],
                                  params: WeaponParams,
                                  base_env: Optional[EnvironmentParams] = None) -> Dict:
        """
        综合分析射手可能的位置
        """
        if base_env is not None:
            air_density = self.air_density_calculator.calculate_air_density(base_env)
        else:
            air_density = self.DEFAULT_AIR_DENSITY
        
        points = [np.array([bh['position'].x, bh['position'].y, bh['position'].z]) 
                  for bh in bullet_holes]
        
        if len(points) >= 2:
            trajectory_result = self.calculate_trajectory_from_two_points(
                points[0], points[1], params, air_density, base_env=base_env
            )
            
            if trajectory_result:
                trajectory = trajectory_result['trajectory']
                
                direction = points[1] - points[0]
                direction = direction / (np.linalg.norm(direction) + 1e-8)
                
                avg_velocity = trajectory_result['initial_velocity']
                travel_time = np.linalg.norm(points[1] - points[0]) / avg_velocity
                
                shooter_estimate = points[0] - direction * avg_velocity * 0.5
                
                trajectory_points = [
                    TrajectoryPoint(
                        position=Point3D(x=float(p.position[0]), y=float(p.position[1]), z=float(p.position[2])),
                        velocity=float(np.linalg.norm(p.velocity)),
                        time=float(p.time)
                    )
                    for p in trajectory
                ]
                
                probability_cone = self.calculate_probability_cone(bullet_holes, params)
                
                return {
                    'shooter_position': Point3D(
                        x=float(shooter_estimate[0]),
                        y=float(shooter_estimate[1]),
                        z=float(shooter_estimate[2])
                    ),
                    'trajectory_data': trajectory_points,
                    'probability_cone': probability_cone,
                    'estimated_velocity': trajectory_result['initial_velocity'],
                    'travel_time': travel_time,
                    'air_density_used': air_density,
                    'environment_params': {
                        'temperature': base_env.temperature if base_env else 20.0,
                        'altitude': base_env.altitude if base_env else 0.0,
                        'humidity': base_env.humidity if base_env else 50.0
                    } if base_env else None
                }
        
        return {
            'shooter_position': None,
            'trajectory_data': [],
            'probability_cone': None,
            'estimated_velocity': None,
            'travel_time': None,
            'air_density_used': air_density,
            'environment_params': None
        }
    
    def generate_default_params(self, weapon_type: str) -> WeaponParams:
        """
        根据枪支类型生成默认参数
        """
        weapon_configs = {
            'pistol': {
                'initial_velocity_min': 300.0,
                'initial_velocity_max': 400.0,
                'bullet_mass': 8.0,
                'drag_coefficient': 0.2,
                'bullet_diameter': 0.009
            },
            'rifle': {
                'initial_velocity_min': 700.0,
                'initial_velocity_max': 950.0,
                'bullet_mass': 10.0,
                'drag_coefficient': 0.15,
                'bullet_diameter': 0.0078
            },
            'shotgun': {
                'initial_velocity_min': 350.0,
                'initial_velocity_max': 450.0,
                'bullet_mass': 30.0,
                'drag_coefficient': 0.25,
                'bullet_diameter': 0.007
            },
            'smg': {
                'initial_velocity_min': 350.0,
                'initial_velocity_max': 500.0,
                'bullet_mass': 6.0,
                'drag_coefficient': 0.2,
                'bullet_diameter': 0.009
            }
        }
        
        config = weapon_configs.get(weapon_type.lower(), weapon_configs['pistol'])
        
        return WeaponParams(**config)
    
    def generate_default_environment(self) -> EnvironmentParams:
        """
        生成默认环境参数
        """
        return EnvironmentParams(
            temperature=20.0,
            altitude=0.0,
            humidity=50.0,
            pressure=None
        )
