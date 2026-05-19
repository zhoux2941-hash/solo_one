# 刚性微分方程积分器使用指南

## 概述

本项目为连续时间强化学习环境提供了多种数值积分器，专门用于解决刚性微分方程（如化学反应、机械系统）场景下RK4积分器数值不稳定导致仿真发散的问题。

## 可用积分器

| 积分器名称 | 类型 | 阶数 | 稳定性 | 适用场景 |
|-----------|------|------|--------|---------|
| `rk4` | 显式Runge-Kutta | 4 | 条件稳定 | 非刚性系统，快速计算 |
| `rk45` | 自适应Runge-Kutta | 5 | 优于RK4 | 中等刚性系统 |
| `implicit_euler` | 隐式Euler | 1 | A-稳定 | 高刚性系统，稳定性优先 |
| `implicit_midpoint` | 隐式中点法 | 2 | A-稳定，辛 | 刚性哈密顿系统 |
| `trapezoidal` | 梯形法 | 2 | A-稳定 | 刚性系统，需较好精度 |
| `radauIIA` | 隐式Runge-Kutta | 3 | L-稳定 | 非常刚性的工业问题 |
| `adaptive_implicit` | 自适应隐式 | 2 | A-稳定+步长控制 | 可变时间尺度的刚性系统 |

## 快速开始

### 基本用法

```python
from continuous_rl import AutonomousOvertakeEnv

# 使用隐式梯形法积分器
env = AutonomousOvertakeEnv(
    dt=0.01,
    max_time=10.0,
    integrator='trapezoidal'  # 选择积分器类型
)

# 使用自适应步长RK45
env = AutonomousOvertakeEnv(
    dt=0.01,
    max_time=10.0,
    integrator='rk45',
    integrator_kwargs={
        'atol': 1e-6,  # 绝对误差容限
        'rtol': 1e-6,  # 相对误差容限
        'max_step': 0.1,
        'min_step': 1e-8
    }
)
```

### 自定义ODE环境使用积分器

```python
from continuous_rl import ODEEnv

class MyStiffEnv(ODEEnv):
    def __init__(self, dt=0.01, max_time=10.0):
        super().__init__(
            state_dim=2,
            action_dim=1,
            dt=dt,
            max_time=max_time,
            integrator='radauIIA'  # 使用L-稳定的RadauIIA积分器
        )
    
    def ode(self, state, action, t):
        # 定义你的刚性微分方程
        x, y = state
        return np.array([-1000.0 * x + y, -0.1 * y])
    
    def _sample_initial_state(self):
        return np.array([1.0, 0.0])
    
    def _compute_reward(self, state, action):
        return -state[0]**2
```

## 刚性系统测试案例

### 1. 化学反应动力学

```python
from stiff_systems import ChemicalReactionEnv

env = ChemicalReactionEnv(
    dt=0.001,
    max_time=1.0,
    integrator='implicit_euler'
)
```

### 2. 刚性振荡器

```python
from stiff_systems import StiffOscillatorEnv

env = StiffOscillatorEnv(
    dt=0.001,
    max_time=0.5,
    integrator='trapezoidal'
)
```

### 3. Van der Pol振荡器（强刚性）

```python
from stiff_systems import VanDerPolEnv

env = VanDerPolEnv(
    dt=0.001,
    max_time=5.0,
    mu=1000.0,  # mu越大刚性越强
    integrator='radauIIA'
)
```

### 4. Robertson化学反应（非常刚性）

```python
from stiff_systems import RobertsonReactionEnv

env = RobertsonReactionEnv(
    dt=0.001,
    max_time=10.0,
    integrator='adaptive_implicit'
)
```

## 积分器比较测试

运行测试脚本比较不同积分器的稳定性：

```bash
python test_stiff_systems.py
```

这将测试所有积分器在不同刚性系统上的表现，并输出稳定性结果。

## 可视化比较

生成积分器性能比较图：

```bash
python visualize_stiff_comparison.py
```

## 积分器选择指南

### 1. 非刚性或轻度刚性系统
- **推荐**: `rk4`
- **理由**: 计算最快，精度足够

### 2. 中等刚性系统
- **推荐**: `rk45`
- **理由**: 自适应步长可以自动调整以保持精度

### 3. 刚性系统
- **推荐**: `implicit_euler` 或 `trapezoidal`
- **理由**: A-稳定，保证数值稳定性

### 4. 非常刚性系统（如化学反应）
- **推荐**: `radauIIA`
- **理由**: L-稳定，对刚性系统有最佳稳定性

### 5. 多时间尺度系统
- **推荐**: `adaptive_implicit`
- **理由**: 结合隐式稳定性和自适应步长

## 问题诊断

### 仿真发散（数值溢出、NaN）

**症状**: 状态值爆炸式增长，出现NaN

**解决方案**:
1. 切换到隐式积分器：`integrator='implicit_euler'` 或 `'trapezoidal'`
2. 减小时间步长：`dt=0.001`
3. 对于非常刚性的系统，使用 `'radauIIA'`

### 计算速度太慢

**症状**: 每步计算时间过长

**解决方案**:
1. 对于非刚性系统，切换到 `'rk4'`
2. 调整误差容限：`integrator_kwargs={'atol': 1e-4, 'rtol': 1e-4}`
3. 使用低阶隐式方法：`'implicit_euler'`

### 精度不够

**症状**: 结果与解析解偏差较大

**解决方案**:
1. 减小时间步长
2. 使用高阶积分器：`'trapezoidal'` 或 `'radauIIA'`
3. 收紧误差容限：`atol=1e-8, rtol=1e-8`

## 技术原理

### 刚性微分方程的特点

刚性微分方程的特征是雅可比矩阵的特征值差异巨大（几个数量级），导致显式方法需要极小的时间步长才能保持稳定。

### 隐式积分器的优势

隐式积分器通过求解非线性方程来获得下一个状态：
```
y_{n+1} = y_n + dt * f(y_{n+1}, t_{n+1})
```

这使得它们具有A-稳定性，无论步长多大都能保持线性系统的稳定性。

### 自适应步长

自适应积分器（如RK45）使用嵌入式方法同时计算两个不同阶的解，通过差值估计误差并自动调整步长。

## 示例文件

- `example.py`: 完整使用示例
- `test_basic.py`: 基本功能测试
- `test_stiff_systems.py`: 刚性系统积分器稳定性测试
- `stiff_systems.py`: 刚性系统环境定义
- `visualize_stiff_comparison.py`: 积分器性能可视化

## 更新日志

### v1.1 - 刚性系统支持
- ✅ 新增7种积分器（3种显式，4种隐式）
- ✅ 支持自适应步长控制
- ✅ 提供4种典型刚性系统测试案例
- ✅ 集成到现有ODE环境框架
- ✅ 提供详细的选择指南和问题诊断

## 引用

本实现基于以下数值方法：
- Dormand-Prince RK45 方法
- 隐式Euler和梯形法
- Radau IIA 隐式Runge-Kutta方法
- 牛顿-拉夫逊非线性求解器（scipy.optimize.root）
