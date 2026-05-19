import numpy as np
import gym
from gym import spaces
from .integrator import get_integrator, INTEGRATORS


class ODEEnv(gym.Env):
    def __init__(self, state_dim, action_dim, dt=0.01, max_time=10.0, 
                 integrator='rk4', integrator_kwargs=None):
        super(ODEEnv, self).__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.dt = dt
        self.max_time = max_time
        
        if integrator_kwargs is None:
            integrator_kwargs = {}
        if 'dt' not in integrator_kwargs:
            integrator_kwargs['dt'] = dt
        
        self.integrator = get_integrator(integrator, **integrator_kwargs)
        self.integrator_name = integrator
        
        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf, shape=(state_dim,), dtype=np.float32
        )
        self.action_space = spaces.Box(
            low=-1.0, high=1.0, shape=(action_dim,), dtype=np.float32
        )
        
        self.state = None
        self.time = 0.0
        self.trajectory = []

    def ode(self, state, action, t):
        raise NotImplementedError("Subclasses must implement this method")

    def reset(self, initial_state=None):
        if initial_state is None:
            self.state = self._sample_initial_state()
        else:
            self.state = np.array(initial_state, dtype=np.float32)
        self.time = 0.0
        self.trajectory = [self.state.copy()]
        return self.state.copy()

    def _sample_initial_state(self):
        raise NotImplementedError("Subclasses must implement this method")

    def step(self, action):
        action = np.clip(action, self.action_space.low, self.action_space.high)
        self.state = self.integrator.step(self.ode, self.state, action, self.time)
        self.time += self.dt
        self.trajectory.append(self.state.copy())
        
        reward = self._compute_reward(self.state, action)
        done = self._check_done(self.state)
        info = {'time': self.time}
        
        return self.state.copy(), reward, done, info

    def _compute_reward(self, state, action):
        raise NotImplementedError("Subclasses must implement this method")

    def _check_done(self, state):
        return self.time >= self.max_time

    def render(self, mode='human'):
        pass

    def get_trajectory(self):
        return np.array(self.trajectory)
