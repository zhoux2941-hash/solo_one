"""
ONNX导出示例脚本
演示如何将仿真环境导出为ONNX格式，用于边缘端部署
"""
import numpy as np
import sys
import os

sys.path.insert(0, 'e:/trae-project/0508-299')


def check_dependencies():
    """检查依赖项"""
    print("=" * 60)
    print("检查依赖项...")
    print("=" * 60)
    
    dependencies = {
        'PyTorch': False,
        'ONNX': False,
        'ONNX Runtime': False
    }
    
    try:
        import torch
        print(f"✓ PyTorch {torch.__version__}")
        dependencies['PyTorch'] = True
    except ImportError:
        print("✗ PyTorch not installed")
    
    try:
        import onnx
        print(f"✓ ONNX {onnx.__version__}")
        dependencies['ONNX'] = True
    except ImportError:
        print("✗ ONNX not installed")
    
    try:
        import onnxruntime as ort
        print(f"✓ ONNX Runtime {ort.__version__}")
        dependencies['ONNX Runtime'] = True
    except ImportError:
        print("✗ ONNX Runtime not installed")
    
    print()
    return dependencies


def example_basic_export():
    """基本导出示例"""
    print("=" * 60)
    print("示例 1: 基本ONNX导出")
    print("=" * 60)
    
    from continuous_rl import create_exportable_env, ONNXExporter
    import torch
    
    # 1. 创建可导出的环境模型
    print("\n1. 创建可导出的环境模型...")
    model = create_exportable_env(
        dt=0.01,
        integrator_type='euler',  # Euler适合边缘端，计算量小
        normalize_states=True
    )
    print(f"   模型类型: {type(model).__name__}")
    print(f"   积分器: {model.dynamics.integrator_type}")
    print(f"   时间步长: {model.dynamics.dt}s")
    
    # 2. 测试PyTorch模型
    print("\n2. 测试PyTorch模型...")
    batch_size = 4
    state = torch.randn(batch_size, 8, dtype=torch.float32)
    action = torch.tensor([[0.1, 0.5]] * batch_size, dtype=torch.float32)
    t = torch.zeros(batch_size, 1, dtype=torch.float32)
    
    with torch.no_grad():
        next_state, reward, done = model(state, action, t)
    
    print(f"   输入状态形状: {state.shape}")
    print(f"   输出状态形状: {next_state.shape}")
    print(f"   奖励形状: {reward.shape}")
    print(f"   终止标志形状: {done.shape}")
    print(f"   状态范围: [{next_state.min():.3f}, {next_state.max():.3f}]")
    
    # 3. 导出为ONNX
    print("\n3. 导出为ONNX格式...")
    output_dir = 'onnx_models'
    os.makedirs(output_dir, exist_ok=True)
    
    filepath = os.path.join(output_dir, 'vehicle_env.onnx')
    exporter = ONNXExporter(model)
    
    exporter.export(
        filepath,
        batch_size=-1,  # 动态批处理
        opset_version=13,
        do_constant_folding=True
    )
    
    # 4. 验证ONNX模型
    print("\n4. 验证ONNX模型...")
    if ONNXExporter.validate_onnx(filepath):
        print("   ✓ ONNX模型验证通过")
    
    # 5. 比较PyTorch和ONNX输出
    print("\n5. 比较PyTorch和ONNX输出...")
    test_state = torch.randn(1, 8, dtype=torch.float32)
    test_action = torch.tensor([[0.0, 0.3]], dtype=torch.float32)
    test_t = torch.zeros(1, 1, dtype=torch.float32)
    
    if ONNXExporter.compare_with_torch(filepath, model, test_state, test_action, test_t):
        print("   ✓ PyTorch和ONNX输出一致")
    
    return filepath


def example_integrator_comparison():
    """比较不同积分器的导出"""
    print("\n" + "=" * 60)
    print("示例 2: 不同积分器导出比较")
    print("=" * 60)
    
    from continuous_rl import create_exportable_env, ONNXExporter
    import torch
    
    integrators = ['euler', 'midpoint', 'rk4']
    output_dir = 'onnx_models'
    os.makedirs(output_dir, exist_ok=True)
    
    results = {}
    
    for int_type in integrators:
        print(f"\n积分器: {int_type}")
        
        model = create_exportable_env(dt=0.01, integrator_type=int_type)
        filepath = os.path.join(output_dir, f'vehicle_env_{int_type}.onnx')
        
        exporter = ONNXExporter(model)
        exporter.export(filepath, batch_size=1)
        
        # 获取文件大小
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        results[int_type] = size_mb
        
        print(f"   文件大小: {size_mb:.3f} MB")
    
    print("\n积分器比较总结:")
    for int_type, size in results.items():
        print(f"   {int_type:10s}: {size:.3f} MB")


def example_optimization():
    """模型优化示例"""
    print("\n" + "=" * 60)
    print("示例 3: 边缘端优化（量化、简化）")
    print("=" * 60)
    
    from continuous_rl import create_exportable_env, ONNXExporter, ModelOptimizer
    import torch
    
    output_dir = 'onnx_models'
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. 创建并导出基础模型
    print("\n1. 创建基础模型...")
    model = create_exportable_env(dt=0.01, integrator_type='euler')
    base_path = os.path.join(output_dir, 'vehicle_env_base.onnx')
    
    exporter = ONNXExporter(model)
    exporter.export(base_path, batch_size=-1)
    
    base_size = os.path.getsize(base_path) / (1024 * 1024)
    print(f"   基础模型大小: {base_size:.3f} MB")
    
    # 2. 模型简化
    print("\n2. 模型简化...")
    simplified_path = os.path.join(output_dir, 'vehicle_env_simplified.onnx')
    ModelOptimizer.simplify_model(base_path, simplified_path)
    
    if os.path.exists(simplified_path):
        simplified_size = os.path.getsize(simplified_path) / (1024 * 1024)
        print(f"   简化后大小: {simplified_size:.3f} MB")
        print(f"   压缩率: {(1 - simplified_size/base_size)*100:.1f}%")
    
    # 3. 模型量化
    print("\n3. 模型量化 (INT8)...")
    quantized_path = os.path.join(output_dir, 'vehicle_env_quantized.onnx')
    ModelOptimizer.quantize_model(base_path, quantized_path, quantization_type='dynamic')
    
    if os.path.exists(quantized_path):
        quantized_size = os.path.getsize(quantized_path) / (1024 * 1024)
        print(f"   量化后大小: {quantized_size:.3f} MB")
        print(f"   压缩率: {(1 - quantized_size/base_size)*100:.1f}%")
    
    return base_path, quantized_path


def example_edge_deployment():
    """边缘端部署示例"""
    print("\n" + "=" * 60)
    print("示例 4: 边缘端推理演示")
    print("=" * 60)
    
    from continuous_rl import create_exportable_env, ONNXExporter
    import torch
    
    output_dir = 'onnx_models'
    model_path = os.path.join(output_dir, 'vehicle_env_euler.onnx')
    
    if not os.path.exists(model_path):
        model = create_exportable_env(dt=0.01, integrator_type='euler')
        exporter = ONNXExporter(model)
        exporter.export(model_path, batch_size=-1)
    
    try:
        import onnxruntime as ort
        
        print("\n1. 创建ONNX Runtime会话...")
        session_options = ort.SessionOptions()
        session_options.intra_op_num_threads = 1  # 边缘端通常使用单线程
        session_options.inter_op_num_threads = 1
        session_options.enable_mem_pattern = False
        session_options.enable_cpu_mem_arena = False
        
        session = ort.InferenceSession(model_path, sess_options=session_options)
        print(f"   可用的执行提供者: {session.get_providers()}")
        
        # 2. 模拟实时推理
        print("\n2. 模拟实时推理（200步仿真）...")
        state = np.array([[0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0]], dtype=np.float32)
        total_time = 0.0
        
        import time
        
        for step in range(200):
            action = np.array([[0.05 * np.sin(0.1 * step), 0.3]], dtype=np.float32)
            t = np.array([[step * 0.01]], dtype=np.float32)
            
            start_time = time.perf_counter()
            
            inputs = {
                'state': state,
                'action': action,
                't': t
            }
            outputs = session.run(None, inputs)
            
            end_time = time.perf_counter()
            total_time += (end_time - start_time)
            
            state, reward, done = outputs
            
            if done[0, 0] > 0.5:
                print(f"   仿真在第 {step} 步终止")
                break
        
        avg_time = total_time / 200 * 1000
        print(f"   平均推理时间: {avg_time:.2f} ms")
        print(f"   推理频率: {1000/avg_time:.1f} Hz")
        
        # 3. 不同批处理大小测试
        print("\n3. 批处理性能测试...")
        batch_sizes = [1, 2, 4, 8, 16]
        for batch_size in batch_sizes:
            state_batch = np.random.randn(batch_size, 8).astype(np.float32)
            action_batch = np.random.randn(batch_size, 2).astype(np.float32)
            t_batch = np.zeros((batch_size, 1), dtype=np.float32)
            
            start_time = time.perf_counter()
            for _ in range(100):
                inputs = {
                    'state': state_batch,
                    'action': action_batch,
                    't': t_batch
                }
                session.run(None, inputs)
            end_time = time.perf_counter()
            
            time_per_batch = (end_time - start_time) / 100 * 1000
            time_per_sample = time_per_batch / batch_size
            print(f"   批次大小 {batch_size:2d}: {time_per_batch:.2f} ms/batch, "
                  f"{time_per_sample:.3f} ms/sample")
        
    except ImportError:
        print("   ONNX Runtime not available. Skipping inference demo.")


def example_custom_ode_export():
    """自定义ODE导出示例"""
    print("\n" + "=" * 60)
    print("示例 5: 自定义ODE模型导出")
    print("=" * 60)
    
    import torch
    import torch.nn as nn
    
    from continuous_rl.onnx_export import TorchIntegrator, ONNXExporter
    
    class CustomPendulumDynamics(nn.Module):
        """自定义倒立摆动力学模型"""
        
        def __init__(self, dt=0.01):
            super().__init__()
            self.dt = dt
            self.register_buffer('g', torch.tensor(9.81))
            self.register_buffer('l', torch.tensor(1.0))
            self.register_buffer('m', torch.tensor(1.0))
            self.register_buffer('b', torch.tensor(0.1))
        
        def ode(self, state, action, t):
            theta, theta_dot = state[..., 0:1], state[..., 1:2]
            torque = action[..., 0:1]
            
            theta_ddot = (-self.g / self.l * torch.sin(theta) 
                         - self.b / (self.m * self.l**2) * theta_dot 
                         + torque / (self.m * self.l**2))
            
            return torch.cat([theta_dot, theta_ddot], dim=-1)
        
        def forward(self, state, action, t):
            return TorchIntegrator.rk4_step(self.ode, state, action, t, self.dt)
    
    print("\n1. 创建自定义摆动力学模型...")
    model = CustomPendulumDynamics(dt=0.01)
    
    print("2. 导出为ONNX...")
    output_dir = 'onnx_models'
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, 'pendulum_dynamics.onnx')
    
    # 创建简单的导出器
    model.eval()
    dummy_state = torch.randn(1, 2, dtype=torch.float32)
    dummy_action = torch.randn(1, 1, dtype=torch.float32)
    dummy_t = torch.zeros(1, 1, dtype=torch.float32)
    
    torch.onnx.export(
        model,
        (dummy_state, dummy_action, dummy_t),
        filepath,
        export_params=True,
        opset_version=13,
        input_names=['state', 'action', 't'],
        output_names=['next_state'],
        dynamic_axes={
            'state': {0: 'batch_size'},
            'action': {0: 'batch_size'},
            't': {0: 'batch_size'},
            'next_state': {0: 'batch_size'}
        }
    )
    
    print(f"   自定义模型已导出到: {filepath}")
    print(f"   文件大小: {os.path.getsize(filepath)/1024:.2f} KB")
    
    ONNXExporter.validate_onnx(filepath)
    
    return filepath


def print_deployment_guide():
    """打印边缘端部署指南"""
    print("\n" + "=" * 60)
    print("边缘端部署指南")
    print("=" * 60)
    
    print("""
推荐部署配置:

1. 积分器选择:
   - 极限资源场景: Euler (最快)
   - 平衡场景: Midpoint
   - 精度优先: RK4

2. 量化选项:
   - CPU边缘设备: INT8动态量化
   - GPU/NPU: FP16半精度
   - 极端场景: INT4 (需额外工具)

3. ONNX Runtime配置:
   - 单线程推理 (inter_op_num_threads=1)
   - 禁用内存优化 (省电模式)
   - 使用CPU执行提供者

4. 性能目标 (典型Cortex-A72):
   - 单步推理: < 1ms
   - 实时仿真频率: > 1000Hz
   - 内存占用: < 1MB

5. 支持的边缘平台:
   - Raspberry Pi 4/5
   - NVIDIA Jetson Nano/Xavier
   - Google Coral
   - 嵌入式Linux设备
   - Android/iOS (通过ONNX Runtime Mobile)
""")


def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("  连续时间强化学习环境 - ONNX导出工具")
    print("  用于边缘端部署的仿真环境优化")
    print("=" * 60)
    
    deps = check_dependencies()
    
    if not deps['PyTorch']:
        print("\n错误: PyTorch是必需的依赖项。")
        print("请运行: pip install torch")
        return
    
    # 运行示例
    try:
        example_basic_export()
        example_integrator_comparison()
        example_optimization()
        
        if deps['ONNX Runtime']:
            example_edge_deployment()
        
        example_custom_ode_export()
    except Exception as e:
        print(f"\n示例运行出错: {e}")
        import traceback
        traceback.print_exc()
    
    print_deployment_guide()
    
    print("\n" + "=" * 60)
    print("所有示例运行完成！")
    print("导出的模型保存在 'onnx_models/' 目录中")
    print("=" * 60)


if __name__ == "__main__":
    main()
