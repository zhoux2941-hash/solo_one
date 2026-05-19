import numpy as np
import warnings

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    warnings.warn("PyTorch not available. ONNX export functionality will be limited.")

try:
    import onnx
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    warnings.warn("ONNX/ONNX Runtime not available. ONNX export will be skipped.")


class TorchIntegrator:
    """PyTorch版本的积分器，用于ONNX导出"""
    
    @staticmethod
    def rk4_step(ode_func, state, action, t, dt):
        """RK4积分步骤"""
        k1 = ode_func(state, action, t)
        k2 = ode_func(state + 0.5 * dt * k1, action, t + 0.5 * dt)
        k3 = ode_func(state + 0.5 * dt * k2, action, t + 0.5 * dt)
        k4 = ode_func(state + dt * k3, action, t + dt)
        new_state = state + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        return new_state
    
    @staticmethod
    def euler_step(ode_func, state, action, t, dt):
        """Euler积分步骤（计算量小，适合边缘）"""
        return state + dt * ode_func(state, action, t)
    
    @staticmethod
    def midpoint_step(ode_func, state, action, t, dt):
        """中点法积分步骤"""
        k1 = ode_func(state, action, t)
        k2 = ode_func(state + 0.5 * dt * k1, action, t + 0.5 * dt)
        return state + dt * k2


class TorchVehicleDynamics(nn.Module):
    """PyTorch版本的车辆动力学模型，可导出为ONNX"""
    
    def __init__(self, dt=0.01, integrator_type='euler'):
        super().__init__()
        self.dt = dt
        self.integrator_type = integrator_type
        
        self.register_buffer('mass', torch.tensor(1500.0))
        self.register_buffer('L', torch.tensor(2.5))
        self.register_buffer('Ca', torch.tensor(0.3))
        self.register_buffer('rho', torch.tensor(1.225))
        self.register_buffer('A', torch.tensor(2.5))
        self.register_buffer('Cr', torch.tensor(0.015))
        self.register_buffer('g', torch.tensor(9.81))
    
    def ode(self, state, action, t):
        """车辆动力学微分方程（PyTorch版本）
        
        state: [x_ego, v_ego, psi, delta, y_ego, y_dot_ego, x_lead, v_lead]
        action: [steer_cmd, throttle_cmd]
        """
        x_ego = state[..., 0:1]
        v_ego = state[..., 1:2]
        psi = state[..., 2:3]
        delta = state[..., 3:4]
        y_ego = state[..., 4:5]
        y_dot_ego = state[..., 5:6]
        x_lead = state[..., 6:7]
        v_lead = state[..., 7:8]
        
        steer_cmd = action[..., 0:1]
        throttle_cmd = action[..., 1:2]
        
        delta_dot = 2.0 * (steer_cmd * torch.pi / 6 - delta)
        
        F_aero = 0.5 * self.rho * self.A * self.Ca * v_ego**2
        F_roll = self.mass * self.g * self.Cr
        F_drive = throttle_cmd * 5000.0 * torch.where(
            v_ego < 30.0,
            torch.ones_like(v_ego),
            torch.clamp(1 - (v_ego - 30) / 20, min=0)
        )
        
        v_dot = (F_drive - F_aero - F_roll) / self.mass
        
        beta = torch.atan(0.5 * torch.tan(delta))
        psi_dot = v_ego * torch.sin(beta) / (0.5 * self.L)
        
        x_dot_ego = v_ego * torch.cos(psi)
        y_dot = v_ego * torch.sin(psi)
        y_ddot = v_dot * torch.sin(psi) + v_ego * psi_dot * torch.cos(psi)
        
        a_lead = -0.5 * torch.sin(0.2 * t)
        x_dot_lead = v_lead
        v_dot_lead = a_lead
        
        return torch.cat([
            x_dot_ego, v_dot, psi_dot, delta_dot,
            y_dot, y_ddot, x_dot_lead, v_dot_lead
        ], dim=-1)
    
    def forward(self, state, action, t):
        """前向传播：执行一步仿真
        
        Args:
            state: 状态张量 [batch_size, 8]
            action: 动作张量 [batch_size, 2]
            t: 当前时间 [batch_size, 1] 或标量
        
        Returns:
            next_state: 下一状态 [batch_size, 8]
        """
        if self.integrator_type == 'rk4':
            return TorchIntegrator.rk4_step(self.ode, state, action, t, self.dt)
        elif self.integrator_type == 'midpoint':
            return TorchIntegrator.midpoint_step(self.ode, state, action, t, self.dt)
        else:  # euler
            return TorchIntegrator.euler_step(self.ode, state, action, t, self.dt)


class TorchVehicleEnvWrapper(nn.Module):
    """完整的环境包装器，包含状态归一化和奖励计算"""
    
    def __init__(self, dt=0.01, integrator_type='euler', normalize_states=True):
        super().__init__()
        self.dynamics = TorchVehicleDynamics(dt, integrator_type)
        self.normalize_states = normalize_states
        
        if normalize_states:
            self.register_buffer('state_mean', torch.tensor([
                0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0
            ]))
            self.register_buffer('state_std', torch.tensor([
                100.0, 10.0, 0.5, 0.5, 5.0, 2.0, 100.0, 5.0
            ]))
        
        self.register_buffer('target_lane', torch.tensor(3.5))
        self.register_buffer('safe_distance', torch.tensor(10.0))
    
    def compute_reward(self, state, action):
        """计算奖励"""
        x_ego = state[..., 0:1]
        v_ego = state[..., 1:2]
        y_ego = state[..., 4:5]
        x_lead = state[..., 6:7]
        
        distance_to_lead = x_lead - x_ego
        
        lane_reward = -torch.abs(y_ego - self.target_lane) * 0.5
        lane_reward = lane_reward + torch.where(
            torch.abs(y_ego - self.target_lane) < 0.3,
            torch.ones_like(lane_reward),
            torch.zeros_like(lane_reward)
        )
        
        speed_reward = v_ego * 0.01
        
        collision_penalty = torch.where(
            (distance_to_lead < self.safe_distance) & (y_ego < 1.0),
            -10.0 * (self.safe_distance - distance_to_lead),
            torch.zeros_like(distance_to_lead)
        )
        
        action_penalty = -0.01 * (action[..., 0:1]**2 + action[..., 1:2]**2)
        
        overtake_bonus = torch.where(
            (x_ego > x_lead) & (torch.abs(y_ego - self.target_lane) < 0.5),
            torch.ones_like(x_ego) * 10.0,
            torch.zeros_like(x_ego)
        )
        
        total_reward = lane_reward + speed_reward + collision_penalty + action_penalty + overtake_bonus
        
        return total_reward
    
    def check_done(self, state):
        """检查是否终止"""
        x_ego = state[..., 0:1]
        v_ego = state[..., 1:2]
        y_ego = state[..., 4:5]
        x_lead = state[..., 6:7]
        
        distance_to_lead = x_lead - x_ego
        
        collision = (distance_to_lead < 0) & (torch.abs(y_ego) < 1.0)
        out_of_lane = torch.abs(y_ego) > 7.0
        speed_too_low = v_ego < 5.0
        successful_overtake = (x_ego > x_lead + 20) & (torch.abs(y_ego - self.target_lane) < 0.5)
        
        done = collision | out_of_lane | speed_too_low | successful_overtake
        
        return done.float()
    
    def normalize_state(self, state):
        """状态归一化"""
        if self.normalize_states:
            return (state - self.state_mean) / (self.state_std + 1e-8)
        return state
    
    def forward(self, state, action, t):
        """完整的环境前向传播
        
        Returns:
            next_state: 下一状态
            reward: 奖励
            done: 终止标志
        """
        next_state = self.dynamics(state, action, t)
        reward = self.compute_reward(next_state, action)
        done = self.check_done(next_state)
        
        return next_state, reward, done


class ONNXExporter:
    """ONNX导出器"""
    
    def __init__(self, model):
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required for ONNX export")
        self.model = model
        self.model.eval()
    
    def export(self, filepath, batch_size=1, state_dim=8, action_dim=2, 
               opset_version=13, do_constant_folding=True,
               optimize=False):
        """导出模型为ONNX格式
        
        Args:
            filepath: 输出文件路径
            batch_size: 批大小 (-1 表示动态批处理)
            state_dim: 状态维度
            action_dim: 动作维度
            opset_version: ONNX算子集版本
            do_constant_folding: 是否进行常量折叠优化
            optimize: 是否进行模型优化
        """
        if batch_size == -1:
            state_shape = (None, state_dim)
            action_shape = (None, action_dim)
            t_shape = (None, 1)
        else:
            state_shape = (batch_size, state_dim)
            action_shape = (batch_size, action_dim)
            t_shape = (batch_size, 1)
        
        dummy_state = torch.randn(state_shape, dtype=torch.float32)
        dummy_action = torch.randn(action_shape, dtype=torch.float32)
        dummy_t = torch.zeros(t_shape, dtype=torch.float32)
        
        dynamic_axes = None
        if batch_size == -1:
            dynamic_axes = {
                'state': {0: 'batch_size'},
                'action': {0: 'batch_size'},
                't': {0: 'batch_size'},
                'next_state': {0: 'batch_size'},
                'reward': {0: 'batch_size'},
                'done': {0: 'batch_size'}
            }
        
        torch.onnx.export(
            self.model,
            (dummy_state, dummy_action, dummy_t),
            filepath,
            export_params=True,
            opset_version=opset_version,
            do_constant_folding=do_constant_folding,
            input_names=['state', 'action', 't'],
            output_names=['next_state', 'reward', 'done'],
            dynamic_axes=dynamic_axes,
            verbose=False
        )
        
        print(f"Model exported to {filepath}")
        
        if optimize:
            self._optimize_onnx(filepath)
        
        return filepath
    
    def _optimize_onnx(self, filepath):
        """优化ONNX模型（需要onnxoptimizer）"""
        try:
            import onnxoptimizer
            model = onnx.load(filepath)
            passes = [
                "eliminate_unused_initializer",
                "eliminate_identity",
                "fuse_add_bias_into_conv",
                "fuse_bn_into_conv",
                "fuse_consecutive_concats",
                "fuse_consecutive_reduce_unsqueeze",
                "fuse_pad_into_conv",
                "fuse_transpose_into_gemm"
            ]
            optimized_model = onnxoptimizer.optimize(model, passes)
            onnx.save(optimized_model, filepath)
            print(f"Optimized ONNX model saved to {filepath}")
        except ImportError:
            print("onnxoptimizer not available. Skipping optimization.")
    
    @staticmethod
    def validate_onnx(filepath):
        """验证ONNX模型的有效性"""
        if not ONNX_AVAILABLE:
            print("ONNX not available. Skipping validation.")
            return False
        
        try:
            model = onnx.load(filepath)
            onnx.checker.check_model(model)
            print("ONNX model validation passed.")
            return True
        except Exception as e:
            print(f"ONNX model validation failed: {e}")
            return False
    
    @staticmethod
    def compare_with_torch(onnx_path, torch_model, state, action, t):
        """比较ONNX和PyTorch模型的输出"""
        if not ONNX_AVAILABLE:
            print("ONNX Runtime not available. Skipping comparison.")
            return False
        
        ort_session = ort.InferenceSession(onnx_path)
        
        with torch.no_grad():
            torch_state, torch_reward, torch_done = torch_model(state, action, t)
        
        ort_inputs = {
            'state': state.numpy(),
            'action': action.numpy(),
            't': t.numpy()
        }
        ort_outputs = ort_session.run(None, ort_inputs)
        
        state_diff = np.max(np.abs(torch_state.numpy() - ort_outputs[0]))
        reward_diff = np.max(np.abs(torch_reward.numpy() - ort_outputs[1]))
        done_diff = np.max(np.abs(torch_done.numpy() - ort_outputs[2]))
        
        print(f"State max difference: {state_diff:.2e}")
        print(f"Reward max difference: {reward_diff:.2e}")
        print(f"Done max difference: {done_diff:.2e}")
        
        return state_diff < 1e-4 and reward_diff < 1e-4


class ModelOptimizer:
    """模型优化器，用于边缘端部署"""
    
    @staticmethod
    def quantize_model(model_path, output_path, quantization_type='static'):
        """模型量化（需要onnxruntime-quantization）"""
        try:
            from onnxruntime.quantization import quantize_dynamic, quantize_static, QuantType
            
            if quantization_type == 'dynamic':
                quantize_dynamic(
                    model_path,
                    output_path,
                    weight_type=QuantType.QUInt8
                )
            else:
                print("Static quantization requires calibration data.")
                print("Using dynamic quantization as fallback.")
                quantize_dynamic(
                    model_path,
                    output_path,
                    weight_type=QuantType.QUInt8
                )
            
            print(f"Quantized model saved to {output_path}")
            return output_path
        except ImportError:
            print("onnxruntime-quantization not available. Skipping quantization.")
            return model_path
    
    @staticmethod
    def simplify_model(model_path, output_path):
        """简化ONNX模型（需要onnx-simplifier）"""
        try:
            import onnxsim
            import onnx
            
            model = onnx.load(model_path)
            simplified_model, check = onnxsim.simplify(model)
            
            if check:
                onnx.save(simplified_model, output_path)
                print(f"Simplified model saved to {output_path}")
                return output_path
            else:
                print("Model simplification failed check.")
                return model_path
        except ImportError:
            print("onnx-simplifier not available. Skipping simplification.")
            return model_path


def create_exportable_env(dt=0.01, integrator_type='euler', normalize_states=True):
    """创建可导出的环境
    
    Args:
        dt: 时间步长
        integrator_type: 积分器类型 ('euler', 'midpoint', 'rk4')
        normalize_states: 是否归一化状态
    
    Returns:
        TorchVehicleEnvWrapper实例
    """
    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch is required for exportable environments")
    
    model = TorchVehicleEnvWrapper(
        dt=dt,
        integrator_type=integrator_type,
        normalize_states=normalize_states
    )
    
    return model
