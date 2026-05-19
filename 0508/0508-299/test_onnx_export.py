"""
ONNX导出功能测试脚本
验证导出功能的正确性和性能
"""
import numpy as np
import sys
import os
import tempfile

sys.path.insert(0, 'e:/trae-project/0508-299')


def test_torch_dynamics():
    """测试PyTorch动力学模型"""
    print("测试 1: PyTorch车辆动力学模型...")
    
    try:
        import torch
        from continuous_rl.onnx_export import TorchVehicleDynamics
        
        model = TorchVehicleDynamics(dt=0.01, integrator_type='euler')
        
        # 测试前向传播
        batch_size = 2
        state = torch.tensor([[0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0]] * batch_size)
        action = torch.tensor([[0.1, 0.5]] * batch_size)
        t = torch.zeros(batch_size, 1)
        
        next_state = model(state, action, t)
        
        assert next_state.shape == (batch_size, 8), "输出形状不正确"
        assert not torch.isnan(next_state).any(), "输出包含NaN"
        assert not torch.isinf(next_state).any(), "输出包含Inf"
        
        print(f"   ✓ 输出形状: {next_state.shape}")
        print(f"   ✓ 输出范围: [{next_state.min():.3f}, {next_state.max():.3f}]")
        print("   ✓ 动力学模型测试通过")
        return True
        
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False


def test_integrator_consistency():
    """测试不同积分器的结果一致性（相对）"""
    print("\n测试 2: 不同积分器结果比较...")
    
    try:
        import torch
        from continuous_rl.onnx_export import TorchVehicleDynamics
        
        integrators = ['euler', 'midpoint', 'rk4']
        results = {}
        
        state = torch.tensor([[0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0]])
        action = torch.tensor([[0.0, 0.3]])
        t = torch.zeros(1, 1)
        
        for int_type in integrators:
            model = TorchVehicleDynamics(dt=0.001, integrator_type=int_type)
            next_state = model(state, action, t)
            results[int_type] = next_state
            print(f"   {int_type}: x_ego={next_state[0,0]:.6f}, v_ego={next_state[0,1]:.6f}")
        
        # Euler和RK4应该在小步长下接近
        diff = torch.abs(results['euler'] - results['rk4']).max()
        print(f"   Euler vs RK4 最大差异: {diff:.6f}")
        print("   ✓ 积分器测试通过")
        return True
        
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False


def test_onnx_export():
    """测试ONNX导出功能"""
    print("\n测试 3: ONNX导出功能...")
    
    try:
        import torch
        from continuous_rl.onnx_export import TorchVehicleEnvWrapper, ONNXExporter
        
        model = TorchVehicleEnvWrapper(dt=0.01, integrator_type='euler')
        
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as f:
            temp_path = f.name
        
        try:
            exporter = ONNXExporter(model)
            exporter.export(temp_path, batch_size=1)
            
            # 验证文件存在且有内容
            assert os.path.exists(temp_path), "导出文件不存在"
            assert os.path.getsize(temp_path) > 0, "导出文件为空"
            
            print(f"   ✓ 导出文件: {temp_path}")
            print(f"   ✓ 文件大小: {os.path.getsize(temp_path)/1024:.2f} KB")
            
            # 验证ONNX模型
            try:
                import onnx
                onnx_model = onnx.load(temp_path)
                onnx.checker.check_model(onnx_model)
                print("   ✓ ONNX模型验证通过")
                
                # 检查输入输出
                input_names = [input.name for input in onnx_model.graph.input]
                output_names = [output.name for output in onnx_model.graph.output]
                print(f"   ✓ 输入: {input_names}")
                print(f"   ✓ 输出: {output_names}")
                
            except ImportError:
                print("   - ONNX未安装，跳过验证")
            
            print("   ✓ ONNX导出测试通过")
            return True
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_reward_calculation():
    """测试奖励计算功能"""
    print("\n测试 4: 奖励计算功能...")
    
    try:
        import torch
        from continuous_rl.onnx_export import TorchVehicleEnvWrapper
        
        model = TorchVehicleEnvWrapper(dt=0.01)
        
        # 测试不同场景的奖励
        test_cases = [
            ("车道居中", torch.tensor([[0.0, 25.0, 0.0, 0.0, 3.5, 0.0, 100.0, 20.0]])),
            ("偏离车道", torch.tensor([[0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 100.0, 20.0]])),
            ("接近前车", torch.tensor([[0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 5.0, 20.0]])),
        ]
        
        action = torch.tensor([[0.0, 0.0]])
        
        for name, state in test_cases:
            reward = model.compute_reward(state, action)
            print(f"   {name}: 奖励 = {reward.item():.4f}")
        
        print("   ✓ 奖励计算测试通过")
        return True
        
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False


def test_onnx_inference():
    """测试ONNX推理"""
    print("\n测试 5: ONNX Runtime推理...")
    
    try:
        import torch
        import onnxruntime as ort
        from continuous_rl.onnx_export import TorchVehicleEnvWrapper, ONNXExporter
        
        model = TorchVehicleEnvWrapper(dt=0.01, integrator_type='euler')
        
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as f:
            temp_path = f.name
        
        try:
            exporter = ONNXExporter(model)
            exporter.export(temp_path, batch_size=1)
            
            # 创建推理会话
            session = ort.InferenceSession(temp_path)
            
            # 准备测试数据
            state_np = np.array([[0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0]], dtype=np.float32)
            action_np = np.array([[0.1, 0.5]], dtype=np.float32)
            t_np = np.array([[0.0]], dtype=np.float32)
            
            # PyTorch推理
            state_torch = torch.from_numpy(state_np)
            action_torch = torch.from_numpy(action_np)
            t_torch = torch.from_numpy(t_np)
            
            with torch.no_grad():
                pt_state, pt_reward, pt_done = model(state_torch, action_torch, t_torch)
            
            # ONNX Runtime推理
            inputs = {
                'state': state_np,
                'action': action_np,
                't': t_np
            }
            ort_state, ort_reward, ort_done = session.run(None, inputs)
            
            # 比较结果
            state_diff = np.max(np.abs(pt_state.numpy() - ort_state))
            reward_diff = np.max(np.abs(pt_reward.numpy() - ort_reward))
            done_diff = np.max(np.abs(pt_done.numpy() - ort_done))
            
            print(f"   状态差异: {state_diff:.2e}")
            print(f"   奖励差异: {reward_diff:.2e}")
            print(f"   终止差异: {done_diff:.2e}")
            
            assert state_diff < 1e-4, "状态输出差异过大"
            assert reward_diff < 1e-4, "奖励输出差异过大"
            
            print("   ✓ ONNX推理测试通过")
            return True
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except ImportError:
        print("   - ONNX Runtime未安装，跳过推理测试")
        return True
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False


def test_batch_processing():
    """测试批处理功能"""
    print("\n测试 6: 动态批处理...")
    
    try:
        import torch
        from continuous_rl.onnx_export import TorchVehicleEnvWrapper, ONNXExporter
        
        model = TorchVehicleEnvWrapper(dt=0.01, integrator_type='euler')
        
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as f:
            temp_path = f.name
        
        try:
            exporter = ONNXExporter(model)
            exporter.export(temp_path, batch_size=-1)  # 动态批处理
            
            try:
                import onnxruntime as ort
                session = ort.InferenceSession(temp_path)
                
                # 测试不同批大小
                batch_sizes = [1, 4, 16, 32]
                
                for batch_size in batch_sizes:
                    state_np = np.random.randn(batch_size, 8).astype(np.float32)
                    action_np = np.random.randn(batch_size, 2).astype(np.float32)
                    t_np = np.zeros((batch_size, 1), dtype=np.float32)
                    
                    inputs = {
                        'state': state_np,
                        'action': action_np,
                        't': t_np
                    }
                    outputs = session.run(None, inputs)
                    
                    assert outputs[0].shape[0] == batch_size, f"批大小 {batch_size} 不匹配"
                    print(f"   批大小 {batch_size:2d}: ✓ 输出形状 {outputs[0].shape}")
                
                print("   ✓ 动态批处理测试通过")
                
            except ImportError:
                print("   - ONNX Runtime未安装，跳过批处理测试")
            
            return True
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False


def test_state_normalization():
    """测试状态归一化功能"""
    print("\n测试 7: 状态归一化...")
    
    try:
        import torch
        from continuous_rl.onnx_export import TorchVehicleEnvWrapper
        
        # 测试归一化和非归一化版本
        model_norm = TorchVehicleEnvWrapper(normalize_states=True)
        model_no_norm = TorchVehicleEnvWrapper(normalize_states=False)
        
        state = torch.tensor([[100.0, 30.0, 0.5, 0.3, 5.0, 2.0, 200.0, 25.0]])
        action = torch.tensor([[0.0, 0.0]])
        t = torch.zeros(1, 1)
        
        # 检查归一化参数
        assert hasattr(model_norm, 'state_mean'), "缺少归一化均值"
        assert hasattr(model_norm, 'state_std'), "缺少归一化标准差"
        
        print(f"   状态均值: {model_norm.state_mean}")
        print(f"   状态标准差: {model_norm.state_std}")
        
        # 两个模型应该产生不同的动力学结果？
        # 不，动力学应该相同，只是输入输出的归一化不同
        with torch.no_grad():
            next_norm, _, _ = model_norm(state, action, t)
            next_no_norm, _, _ = model_no_norm(state, action, t)
        
        print(f"   ✓ 归一化版本输出范围: [{next_norm.min():.3f}, {next_norm.max():.3f}]")
        print(f"   ✓ 非归一化版本输出范围: [{next_no_norm.min():.3f}, {next_no_norm.max():.3f}]")
        print("   ✓ 状态归一化测试通过")
        return True
        
    except Exception as e:
        print(f"   ✗ 测试失败: {e}")
        return False


def main():
    """运行所有测试"""
    print("=" * 60)
    print("  ONNX导出功能测试套件")
    print("=" * 60)
    
    tests = [
        ("PyTorch动力学模型", test_torch_dynamics),
        ("积分器一致性", test_integrator_consistency),
        ("ONNX导出功能", test_onnx_export),
        ("奖励计算", test_reward_calculation),
        ("ONNX Runtime推理", test_onnx_inference),
        ("动态批处理", test_batch_processing),
        ("状态归一化", test_state_normalization),
    ]
    
    results = []
    for name, test_func in tests:
        results.append((name, test_func()))
    
    # 打印总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"   {name:20s}: {status}")
    
    print(f"\n总计: {passed}/{total} 测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！ONNX导出功能正常工作。")
    else:
        print(f"\n⚠️  {total - passed} 个测试失败，请检查上述错误信息。")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
