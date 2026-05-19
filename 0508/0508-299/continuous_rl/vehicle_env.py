import numpy as np
from .ode_env import ODEEnv


class AutonomousOvertakeEnv(ODEEnv):
    def __init__(self, dt=0.01, max_time=15.0, integrator='rk4', integrator_kwargs=None):
        state_dim = 8
        action_dim = 2
        super(AutonomousOvertakeEnv, self).__init__(state_dim, action_dim, dt, max_time, 
                                                    integrator, integrator_kwargs)
        
        self.mass = 1500.0
        self.L = 2.5
        self.Ca = 0.3
        self.rho = 1.225
        self.A = 2.5
        self.Cr = 0.015
        self.g = 9.81
        
        self.lane_width = 3.5
        self.target_lane = 3.5
        self.safe_distance = 10.0
        
        self.lead_vehicle_v0 = 20.0
        self.ego_v0 = 22.0
        
        self.observation_space = self._create_observation_space()
        self.action_space = self._create_action_space()

    def _create_observation_space(self):
        from gym import spaces
        low = np.array([
            -100.0,
            0.0,
            -np.pi/4,
            -10.0,
            0.0,
            -50.0,
            0.0,
            -10.0
        ], dtype=np.float32)
        high = np.array([
            500.0,
            50.0,
            np.pi/4,
            10.0,
            10.0,
            50.0,
            50.0,
            10.0
        ], dtype=np.float32)
        return spaces.Box(low=low, high=high, dtype=np.float32)

    def _create_action_space(self):
        from gym import spaces
        low = np.array([-1.0, -1.0], dtype=np.float32)
        high = np.array([1.0, 1.0], dtype=np.float32)
        return spaces.Box(low=low, high=high, dtype=np.float32)

    def ode(self, state, action, t):
        x_ego, v_ego, psi, delta, y_ego, y_dot_ego, x_lead, v_lead = state
        
        steer_cmd = action[0]
        throttle_cmd = action[1]
        
        delta_dot = 2.0 * (steer_cmd * np.pi/6 - delta)
        
        F_aero = 0.5 * self.rho * self.A * self.Ca * v_ego**2
        F_roll = self.mass * self.g * self.Cr
        F_drive = throttle_cmd * 5000.0 * (1.0 if v_ego < 30.0 else max(0, 1 - (v_ego - 30)/20))
        
        v_dot = (F_drive - F_aero - F_roll) / self.mass
        
        beta = np.arctan(0.5 * np.tan(delta))
        psi_dot = v_ego * np.sin(beta) / (0.5 * self.L)
        
        y_dot = v_ego * np.sin(psi)
        y_ddot = v_dot * np.sin(psi) + v_ego * psi_dot * np.cos(psi)
        
        x_dot_ego = v_ego * np.cos(psi)
        
        a_lead = -0.5 * np.sin(0.2 * t)
        x_dot_lead = v_lead
        v_dot_lead = a_lead
        
        return np.array([
            x_dot_ego,
            v_dot,
            psi_dot,
            delta_dot,
            y_dot,
            y_ddot,
            x_dot_lead,
            v_dot_lead
        ], dtype=np.float32)

    def _sample_initial_state(self):
        return np.array([
            0.0,
            self.ego_v0 + np.random.uniform(-2, 2),
            0.0,
            0.0,
            0.0,
            0.0,
            50.0 + np.random.uniform(-10, 10),
            self.lead_vehicle_v0 + np.random.uniform(-2, 2)
        ], dtype=np.float32)

    def _compute_reward(self, state, action):
        x_ego, v_ego, psi, delta, y_ego, y_dot_ego, x_lead, v_lead = state
        
        distance_to_lead = x_lead - x_ego
        
        lane_reward = -abs(y_ego - self.target_lane) * 0.5
        if abs(y_ego - self.target_lane) < 0.3:
            lane_reward += 1.0
        
        speed_reward = v_ego * 0.01
        
        collision_penalty = 0.0
        if distance_to_lead < self.safe_distance and y_ego < 1.0:
            collision_penalty = -10.0 * (self.safe_distance - distance_to_lead)
        
        action_penalty = -0.01 * (action[0]**2 + action[1]**2)
        
        overtake_bonus = 0.0
        if x_ego > x_lead and abs(y_ego - self.target_lane) < 0.5:
            overtake_bonus = 10.0
        
        total_reward = lane_reward + speed_reward + collision_penalty + action_penalty + overtake_bonus
        
        return total_reward

    def _check_done(self, state):
        x_ego, v_ego, psi, delta, y_ego, y_dot_ego, x_lead, v_lead = state
        
        distance_to_lead = x_lead - x_ego
        
        collision = distance_to_lead < 0 and abs(y_ego) < 1.0
        timeout = self.time >= self.max_time
        out_of_lane = abs(y_ego) > 7.0
        speed_too_low = v_ego < 5.0
        successful_overtake = x_ego > x_lead + 20 and abs(y_ego - self.target_lane) < 0.5
        
        return collision or timeout or out_of_lane or speed_too_low or successful_overtake

    def get_vehicle_states(self):
        trajectory = self.get_trajectory()
        ego_x = trajectory[:, 0]
        ego_y = trajectory[:, 4]
        lead_x = trajectory[:, 6]
        lead_y = np.zeros_like(lead_x)
        return ego_x, ego_y, lead_x, lead_y
