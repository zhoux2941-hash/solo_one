"""
边缘端Python推理示例
适用于资源受限的嵌入式设备（如Raspberry Pi）

优化特点:
- 最小化内存占用
- 单线程推理
- 无依赖于PyTorch（仅使用ONNX Runtime）
"""
import os
import sys
import time
import numpy as np

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class EdgeVehicleEnv:
    """
    边缘端车辆环境
    仅依赖ONNX Runtime，无需PyTorch
    """
    
    def __init__(self, model_path=None, num_threads=1):
        """
        初始化边缘端环境
        
        Args:
            model_path: ONNX模型路径
            num_threads: 推理线程数（边缘设备建议1）
        """
        if model_path is None:
            # 默认模型路径
            script_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(
                script_dir, '..', 'onnx_models', 'vehicle_env_euler.onnx'
            )
        
        self.model_path = model_path
        
        # 导入ONNX Runtime
        try:
            import onnxruntime as ort
            self.ort = ort
        except ImportError:
            raise ImportError(
                "ONNX Runtime is required. Install with: pip install onnxruntime"
            )
        
        # 创建会话选项（针对边缘设备优化）
        session_options = ort.SessionOptions()
        session_options.intra_op_num_threads = num_threads
        session_options.inter_op_num_threads = 1
        session_options.enable_mem_pattern = False
        session_options.enable_cpu_mem_arena = False
        
        # 使用CPU执行提供者
        providers = ['CPUExecutionProvider']
        
        # 创建推理会话
        print(f"加载模型: {model_path}")
        self.session = ort.InferenceSession(
            model_path,
            sess_options=session_options,
            providers=providers
        )
        
        print(f"使用执行提供者: {self.session.get_providers()}")
        print(f"线程数: {num_threads}")
        
        # 初始状态
        self.state = None
        self.time = 0.0
        self.dt = 0.01
        
        self.reset()
    
    def reset(self, initial_state=None):
        """重置环境"""
        if initial_state is None:
            self.state = np.array([
                0.0,  # x_ego
                25.0,  # v_ego
                0.0,   # psi
                0.0,   # delta
                0.0,   # y_ego
                0.0,   # y_dot_ego
                50.0,  # x_lead
                20.0   # v_lead
            ], dtype=np.float32)
        else:
            self.state = np.array(initial_state, dtype=np.float32)
        
        self.time = 0.0
        return self.state.copy()
    
    def step(self, action):
        """
        执行一步仿真
        
        Args:
            action: [steer, throttle]
        
        Returns:
            next_state, reward, done, info
        """
        action = np.array(action, dtype=np.float32).reshape(1, 2)
        state_input = self.state.reshape(1, 8)
        t_input = np.array([[self.time]], dtype=np.float32)
        
        inputs = {
            'state': state_input,
            'action': action,
            't': t_input
        }
        
        start_time = time.perf_counter()
        outputs = self.session.run(None, inputs)
        inference_time = (time.perf_counter() - start_time) * 1000
        
        next_state = outputs[0].flatten()
        reward = float(outputs[1].flatten()[0])
        done = bool(outputs[2].flatten()[0] > 0.5)
        
        self.state = next_state
        self.time += self.dt
        
        info = {
            'time': self.time,
            'inference_time_ms': inference_time
        }
        
        return next_state, reward, done, info
    
    def benchmark(self, num_steps=1000):
        """性能基准测试"""
        print(f"\n=== 性能基准测试 ({num_steps} 步) ===")
        
        times = []
        state = self.reset()
        action = [0.0, 0.3]
        
        for i in range(num_steps):
            state, reward, done, info = self.step(action)
            times.append(info['inference_time_ms'])
            
            if done:
                break
        
        avg_time = np.mean(times)
        std_time = np.std(times)
        max_time = np.max(times)
        min_time = np.min(times)
        
        print(f"平均推理时间: {avg_time:.3f} ms")
        print(f"标准差: {std_time:.3f} ms")
        print(f"最小/最大: {min_time:.3f} / {max_time:.3f} ms")
        print(f"推理频率: {1000.0 / avg_time:.1f} Hz")
        
        return {
            'avg_ms': avg_time,
            'std_ms': std_time,
            'max_ms': max_time,
            'min_ms': min_time,
            'frequency_hz': 1000.0 / avg_time
        }
    
    def run_episode(self, policy_fn=None, max_steps=500, verbose=True):
        """
        运行一个完整的episode
        
        Args:
            policy_fn: 策略函数，接受state返回action
            max_steps: 最大步数
            verbose: 是否打印信息
        """
        state = self.reset()
        total_reward = 0.0
        total_inference_time = 0.0
        
        if verbose:
            print(f"\n=== 运行仿真 (最大 {max_steps} 步) ===")
            print("初始状态:")
            self._print_state(state)
        
        for step in range(max_steps):
            # 使用提供的策略或默认策略
            if policy_fn is not None:
                action = policy_fn(state)
            else:
                action = self._default_policy(state, step)
            
            state, reward, done, info = self.step(action)
            total_reward += reward
            total_inference_time += info['inference_time_ms']
            
            if verbose and step % 50 == 0:
                print(f"\n第 {step} 步:")
                self._print_state(state)
                print(f"  奖励: {reward:.4f}")
                print(f"  推理时间: {info['inference_time_ms']:.3f} ms")
            
            if done:
                if verbose:
                    print(f"\n仿真在第 {step} 步终止!")
                break
        
        if verbose:
            print(f"\n=== 仿真总结 ===")
            print(f"总奖励: {total_reward:.2f}")
            print(f"总推理时间: {total_inference_time:.2f} ms")
            print(f"平均每步: {total_inference_time / (step + 1):.3f} ms")
        
        return {
            'total_reward': total_reward,
            'steps': step + 1,
            'total_inference_time_ms': total_inference_time
        }
    
    def _default_policy(self, state, step):
        """默认策略：正弦转向 + 恒定油门"""
        steer = 0.1 * np.sin(0.1 * step)
        throttle = 0.3
        return [steer, throttle]
    
    def _print_state(self, state):
        """打印状态信息"""
        print(f"  位置: ({state[0]:.2f}, {state[4]:.2f}) m")
        print(f"  速度: {state[1]:.2f} m/s")
        print(f"  航向角: {state[2]:.3f} rad")
        print(f"  前车距离: {state[6] - state[0]:.2f} m")


def test_raspberry_pi_optimized():
    """针对Raspberry Pi的优化测试"""
    print("=" * 60)
    print("  边缘端推理测试 (Raspberry Pi优化)")
    print("=" * 60)
    
    # 检查是否在Raspberry Pi上
    try:
        with open('/proc/device-tree/model', 'r') as f:
            model = f.read()
        print(f"\n检测到设备: {model}")
    except:
        print("\n未检测到Raspberry Pi，使用通用配置")
    
    # 创建环境（单线程）
    env = EdgeVehicleEnv(num_threads=1)
    
    # 运行基准测试
    env.benchmark(500)
    
    # 运行完整仿真
    env.run_episode(max_steps=300)
    
    print("\n" + "=" * 60)
    print("  边缘端优化建议")
    print("=" * 60)
    print("""
1. CPU频率:
   - 设置性能模式: sudo cpupower frequency-set -g performance
   - 避免降频影响实时性

2. 内存优化:
   - 禁用内存竞技场 (enable_cpu_mem_arena = False)
   - 使用单线程减少上下文切换

3. 模型优化:
   - 使用Euler积分器（最快）
   - 启用INT8量化减少模型大小
   - 使用onnx-simplifier简化计算图

4. 系统配置:
   - 禁用不必要的后台服务
   - 关闭图形界面
   - 使用实时内核补丁
    """)


def create_small_model():
    """
    创建最小化模型（适合极端资源场景）
    只包含动力学，不包含奖励和终止判断
    """
    print("创建最小化动力学模型...")
    
    try:
        import torch
        import torch.nn as nn
        from continuous_rl.onnx_export import TorchIntegrator
        
        class MinimalDynamics(nn.Module):
            def __init__(self, dt=0.01):
                super().__init__()
                self.dt = dt
                # 只注册必要的参数
                self.register_buffer('mass', torch.tensor(1500.0))
                self.register_buffer('Ca', torch.tensor(0.3))
                self.register_buffer('rho', torch.tensor(1.225))
                self.register_buffer('g', torch.tensor(9.81))
            
            def forward(self, state, action):
                x_ego = state[..., 0:1]
                v_ego = state[..., 1:2]
                psi = state[..., 2:3]
                delta = state[..., 3:4]
                y_ego = state[..., 4:5]
                
                steer_cmd = action[..., 0:1]
                throttle_cmd = action[..., 1:2]
                
                delta_dot = 2.0 * (steer_cmd * 0.5236 - delta)
                
                F_aero = 0.5 * self.rho * 2.5 * self.Ca * v_ego**2
                F_roll = self.mass * self.g * 0.015
                F_drive = throttle_cmd * 5000.0
                
                v_dot = (F_drive - F_aero - F_roll) / self.mass
                
                beta = torch.atan(0.5 * torch.tan(delta))
                psi_dot = v_ego * torch.sin(beta) / 1.25
                
                x_dot = v_ego * torch.cos(psi)
                y_dot = v_ego * torch.sin(psi)
                
                new_state = state + self.dt * torch.cat([
                    x_dot, v_dot, psi_dot, delta_dot, y_dot,
                    torch.zeros_like(v_dot),  # y_dot_dot（简化）
                    20.0 * torch.ones_like(v_dot),  # 前车匀速
                    torch.zeros_like(v_dot)   # 前车加速度
                ], dim=-1)
                
                return new_state
        
        model = MinimalDynamics(dt=0.01)
        model.eval()
        
        # 导出
        dummy_state = torch.randn(1, 8, dtype=torch.float32)
        dummy_action = torch.randn(1, 2, dtype=torch.float32)
        
        output_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), '..', 'onnx_models'
        )
        os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, 'vehicle_dynamics_minimal.onnx')
        
        torch.onnx.export(
            model,
            (dummy_state, dummy_action),
            output_path,
            export_params=True,
            opset_version=13,
            do_constant_folding=True,
            input_names=['state', 'action'],
            output_names=['next_state'],
            dynamic_axes={
                'state': {0: 'batch_size'},
                'action': {0: 'batch_size'},
                'next_state': {0: 'batch_size'}
            }
        )
        
        size_kb = os.path.getsize(output_path) / 1024
        print(f"最小化模型已导出: {output_path}")
        print(f"模型大小: {size_kb:.2f} KB")
        
        return output_path
        
    except ImportError:
        print("PyTorch不可用，跳过模型创建")
        return None


if __name__ == "__main__":
    test_raspberry_pi_optimized()
    
    # 创建最小化模型
    create_small_model()
