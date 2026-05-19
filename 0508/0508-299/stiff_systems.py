import numpy as np
from continuous_rl.ode_env import ODEEnv


class ChemicalReactionEnv(ODEEnv):
    def __init__(self, dt=0.01, max_time=5.0, integrator='rk4', integrator_kwargs=None):
        state_dim = 3
        action_dim = 1
        super(ChemicalReactionEnv, self).__init__(state_dim, action_dim, dt, max_time,
                                                   integrator, integrator_kwargs)
        
        self.k1 = 1000.0
        self.k2 = 1.0
        self.k3 = 0.01

    def ode(self, state, action, t):
        A, B, C = state
        
        rate_control = max(0, 1 + 0.5 * action[0])
        
        dA = -self.k1 * A * rate_control
        dB = self.k1 * A * rate_control - self.k2 * B * C
        dC = self.k2 * B * C - self.k3 * C
        
        return np.array([dA, dB, dC], dtype=np.float32)

    def _sample_initial_state(self):
        return np.array([1.0, 0.0, 0.0], dtype=np.float32)

    def _compute_reward(self, state, action):
        A, B, C = state
        return -np.sum(np.abs(B))


class StiffOscillatorEnv(ODEEnv):
    def __init__(self, dt=0.01, max_time=2.0, integrator='rk4', integrator_kwargs=None):
        state_dim = 2
        action_dim = 1
        super(StiffOscillatorEnv, self).__init__(state_dim, action_dim, dt, max_time,
                                                  integrator, integrator_kwargs)
        
        self.omega_fast = 100.0
        self.omega_slow = 1.0

    def ode(self, state, action, t):
        x_fast, x_slow = state
        
        damping = 0.1 * (1 + action[0])
        
        dx_fast = -self.omega_fast**2 * x_fast - damping * self.omega_fast * x_fast
        dx_slow = -self.omega_slow**2 * x_slow
        
        return np.array([dx_fast, dx_slow], dtype=np.float32)

    def _sample_initial_state(self):
        return np.array([1.0, 1.0], dtype=np.float32)

    def _compute_reward(self, state, action):
        x_fast, x_slow = state
        return -x_fast**2


class VanDerPolEnv(ODEEnv):
    def __init__(self, dt=0.01, max_time=10.0, mu=1000.0, integrator='rk4', integrator_kwargs=None):
        state_dim = 2
        action_dim = 1
        super(VanDerPolEnv, self).__init__(state_dim, action_dim, dt, max_time,
                                            integrator, integrator_kwargs)
        
        self.mu = mu

    def ode(self, state, action, t):
        x, y = state
        
        mu_control = self.mu * (1 + 0.5 * action[0])
        
        dx = y
        dy = mu_control * (1 - x**2) * y - x
        
        return np.array([dx, dy], dtype=np.float32)

    def _sample_initial_state(self):
        return np.array([1.0, 0.0], dtype=np.float32)

    def _compute_reward(self, state, action):
        x, y = state
        return -(x**2 + y**2)


class RobertsonReactionEnv(ODEEnv):
    def __init__(self, dt=0.01, max_time=100.0, integrator='rk4', integrator_kwargs=None):
        state_dim = 3
        action_dim = 1
        super(RobertsonReactionEnv, self).__init__(state_dim, action_dim, dt, max_time,
                                                    integrator, integrator_kwargs)
        
        self.k1 = 0.04
        self.k2 = 3e7
        self.k3 = 1e4

    def ode(self, state, action, t):
        A, B, C = state
        
        k2_mod = self.k2 * (1 + 0.1 * action[0])
        
        dA = -self.k1 * A + self.k3 * B * C
        dB = self.k1 * A - k2_mod * B**2 - self.k3 * B * C
        dC = k2_mod * B**2
        
        return np.array([dA, dB, dC], dtype=np.float32)

    def _sample_initial_state(self):
        return np.array([1.0, 0.0, 0.0], dtype=np.float32)

    def _compute_reward(self, state, action):
        A, B, C = state
        return -np.abs(B)


def compare_integrators(env_class, integrator_list, t_max=10.0, dt=0.01, **env_kwargs=None):
    if env_kwargs is None:
        env_kwargs = {}
    
    results = {}
    
    for integrator_name in integrator_list:
        print(f"Testing {integrator_name}...")
        env = env_class(dt=dt, max_time=t_max, integrator=integrator_name, **env_kwargs)
        
        state = env.reset()
        trajectory = [state.copy()]
        times = [0.0]
        stable = True
        
        try:
            while env.time < t_max:
                action = np.array([0.0], dtype=np.float32)
                state, reward, done, info = env.step(action)
                trajectory.append(state.copy())
                times.append(env.time)
                
                if np.any(np.isnan(state)) or np.any(np.abs(state) > 1e10)):
                    stable = False
                    break
        except Exception as e:
                    stable = False
                    print(f"  Error: {e}")
        
        results[integrator_name] = {
            'trajectory': np.array(trajectory),
            'times': np.array(times),
            'stable': stable,
            'final_state': state,
            'num_steps': len(trajectory)
        }
        
        status = "STABLE" if stable else "UNSTABLE (DIVERGED)"
        print(f"  {status} after {len(trajectory)} steps")
    
    return results
