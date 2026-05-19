import numpy as np
from continuous_rl import (
    AutonomousOvertakeEnv,
    ParallelEnv,
    Visualizer,
    ODEEnv,
    INTEGRATORS
)


def example_single_env():
    print("Running single environment example...")
    
    env = AutonomousOvertakeEnv(dt=0.01, max_time=10.0)
    obs = env.reset()
    
    print(f"Initial observation: {obs}")
    print(f"Observation space: {env.observation_space}")
    print(f"Action space: {env.action_space}")
    
    rewards = []
    done = False
    step = 0
    
    while not done:
        action = np.array([0.1 * np.sin(0.05 * step), 0.5], dtype=np.float32)
        obs, reward, done, info = env.step(action)
        rewards.append(reward)
        step += 1
    
    print(f"Episode finished after {step} steps")
    print(f"Total reward: {sum(rewards):.2f}")
    
    viz = Visualizer()
    
    ego_x, ego_y, lead_x, lead_y = env.get_vehicle_states()
    viz.plot_trajectory(ego_x, ego_y, lead_x, lead_y)
    
    trajectory = env.get_trajectory()
    viz.plot_states(trajectory)
    
    viz.plot_rewards(rewards)
    
    return env, rewards


def example_parallel_env():
    print("\nRunning parallel environment example...")
    
    num_envs = 4
    env_creator = lambda: AutonomousOvertakeEnv(dt=0.01, max_time=5.0)
    
    parallel_env = ParallelEnv(env_creator, num_envs=num_envs)
    obs = parallel_env.reset()
    
    print(f"Number of parallel environments: {num_envs}")
    print(f"Initial observations shape: {obs.shape}")
    
    total_rewards = np.zeros(num_envs)
    done_count = 0
    
    for step in range(500):
        actions = np.random.uniform(-0.5, 0.5, (num_envs, 2)).astype(np.float32)
        actions[:, 1] = 0.3 + 0.2 * np.sin(0.1 * step)
        
        obs, rewards, dones, infos = parallel_env.step(actions)
        total_rewards += rewards
        
        if np.any(dones):
            done_count += np.sum(dones)
            if done_count >= num_envs:
                break
    
    print(f"Total rewards per environment: {total_rewards}")
    
    trajectories = parallel_env.get_trajectories()
    
    viz = Visualizer()
    viz.plot_parallel_trajectories(trajectories)
    
    parallel_env.close()
    
    return parallel_env, trajectories


def example_custom_ode():
    print("\nRunning custom ODE environment example...")
    
    from continuous_rl import ODEEnv
    
    class SimplePendulumEnv(ODEEnv):
        def __init__(self, dt=0.01, max_time=10.0):
            super(SimplePendulumEnv, self).__init__(
                state_dim=2, action_dim=1, dt=dt, max_time=max_time
            )
            self.g = 9.81
            self.L = 1.0
            self.m = 1.0
            self.b = 0.1
        
        def ode(self, state, action, t):
            theta, theta_dot = state
            torque = action[0] * 2.0
            
            theta_ddot = (-self.g / self.L * np.sin(theta) 
                         - self.b / (self.m * self.L**2) * theta_dot 
                         + torque / (self.m * self.L**2))
            
            return np.array([theta_dot, theta_ddot], dtype=np.float32)
        
        def _sample_initial_state(self):
            return np.array([np.pi + np.random.uniform(-0.5, 0.5), 
                             np.random.uniform(-1, 1)], dtype=np.float32)
        
        def _compute_reward(self, state, action):
            theta, theta_dot = state
            theta = ((theta + np.pi) % (2 * np.pi)) - np.pi
            
            angle_reward = -theta**2
            velocity_penalty = -0.1 * theta_dot**2
            action_penalty = -0.001 * action[0]**2
            
            return angle_reward + velocity_penalty + action_penalty
    
    env = SimplePendulumEnv(dt=0.01, max_time=5.0)
    obs = env.reset()
    
    rewards = []
    for step in range(500):
        action = np.array([0.0], dtype=np.float32)
        obs, reward, done, info = env.step(action)
        rewards.append(reward)
        if done:
            break
    
    trajectory = env.get_trajectory()
    
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(2, 1, figsize=(10, 8))
    
    time = np.arange(len(trajectory)) * 0.01
    axes[0].plot(time, trajectory[:, 0], 'b-')
    axes[0].set_xlabel('Time (s)')
    axes[0].set_ylabel('Angle (rad)')
    axes[0].set_title('Pendulum Angle')
    axes[0].grid(True, alpha=0.3)
    
    axes[1].plot(time, trajectory[:, 1], 'r-')
    axes[1].set_xlabel('Time (s)')
    axes[1].set_ylabel('Angular Velocity (rad/s)')
    axes[1].set_title('Pendulum Angular Velocity')
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    return env, rewards


def example_integrator_selection():
    print("\n" + "=" * 60)
    print("Integrator Selection Example")
    print("=" * 60)
    
    print(f"Available integrators: {list(INTEGRATORS.keys())}")
    print()
    
    print("1. Using implicit integrator for stiff systems:")
    env_implicit = AutonomousOvertakeEnv(
        dt=0.01,
        max_time=2.0,
        integrator='trapezoidal'
    )
    print(f"   Integrator: {env_implicit.integrator_name}")
    print(f"   Type: {type(env_implicit.integrator).__name__}")
    
    obs = env_implicit.reset()
    for _ in range(10):
        action = np.array([0.0, 0.3], dtype=np.float32)
        obs, reward, done, info = env_implicit.step(action)
    print(f"   Simulation completed, final state norm: {np.linalg.norm(obs):.4f}")
    
    print("\n2. Using adaptive step size integrator:")
    env_adaptive = AutonomousOvertakeEnv(
        dt=0.01,
        max_time=2.0,
        integrator='rk45',
        integrator_kwargs={'atol': 1e-6, 'rtol': 1e-6}
    )
    print(f"   Integrator: {env_adaptive.integrator_name}")
    
    obs = env_adaptive.reset()
    for _ in range(10):
        action = np.array([0.0, 0.3], dtype=np.float32)
        obs, reward, done, info = env_adaptive.step(action)
    print(f"   Simulation completed, final state norm: {np.linalg.norm(obs):.4f}")
    
    print("\n3. Using RadauIIA for maximum stability:")
    env_radau = AutonomousOvertakeEnv(
        dt=0.01,
        max_time=2.0,
        integrator='radauIIA'
    )
    print(f"   Integrator: {env_radau.integrator_name}")
    
    obs = env_radau.reset()
    for _ in range(10):
        action = np.array([0.0, 0.3], dtype=np.float32)
        obs, reward, done, info = env_radau.step(action)
    print(f"   Simulation completed, final state norm: {np.linalg.norm(obs):.4f}")
    
    print("\nIntegrator selection guidelines:")
    print("  - For non-stiff, smooth dynamics: Use 'rk4' (fastest)")
    print("  - For moderately stiff systems: Use 'rk45' (adaptive step size)")
    print("  - For stiff systems: Use 'implicit_euler', 'trapezoidal', or 'radauIIA'")
    print("  - For variable time scales: Use 'adaptive_implicit'")


if __name__ == "__main__":
    print("=" * 60)
    print("Continuous Time Reinforcement Learning Environment Demo")
    print("=" * 60)
    
    example_single_env()
    example_parallel_env()
    example_custom_ode()
    example_integrator_selection()
    
    print("\nAll examples completed!")
