import numpy as np
from scipy.optimize import root


class Integrator:
    def __init__(self, dt=0.01):
        self.dt = dt
        self.name = self.__class__.__name__

    def step(self, ode_func, state, action, t):
        raise NotImplementedError


class RK4Integrator(Integrator):
    def __init__(self, dt=0.01):
        super().__init__(dt)

    def step(self, ode_func, state, action, t):
        k1 = ode_func(state, action, t)
        k2 = ode_func(state + 0.5 * self.dt * k1, action, t + 0.5 * self.dt)
        k3 = ode_func(state + 0.5 * self.dt * k2, action, t + 0.5 * self.dt)
        k4 = ode_func(state + self.dt * k3, action, t + self.dt)
        new_state = state + (self.dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        return new_state


class AdaptiveRK45Integrator(Integrator):
    def __init__(self, dt=0.01, atol=1e-6, rtol=1e-6, max_step=1.0, min_step=1e-6):
        super().__init__(dt)
        self.atol = atol
        self.rtol = rtol
        self.max_step = max_step
        self.min_step = min_step
        self.last_error = 0.0
        
        self.c = np.array([0, 1/4, 3/8, 12/13, 1, 1/2])
        self.a = np.array([
            [],
            [1/4],
            [3/32, 9/32],
            [1932/2197, -7200/2197, 7296/2197],
            [439/216, -8, 3680/513, -845/4104],
            [-8/27, 2, -3544/2565, 1859/4104, -11/40]
        ], dtype=object)
        self.b4 = np.array([25/216, 0, 1408/2565, 2197/4104, -1/5, 0])
        self.b5 = np.array([16/135, 0, 6656/12825, 28561/56430, -9/50, 2/55])

    def step(self, ode_func, state, action, t):
        dt = self.dt
        max_attempts = 10
        
        for attempt in range(max_attempts):
            k = []
            for i in range(6):
                ti = t + self.c[i] * dt
                yi = state.copy()
                for j in range(i):
                    yi += self.a[i][j] * dt * k[j]
                k.append(ode_func(yi, action, ti))
            
            y4 = state + dt * sum(self.b4[i] * k[i] for i in range(6))
            y5 = state + dt * sum(self.b5[i] * k[i] for i in range(6))
            
            error = np.abs(y5 - y4)
            scale = self.atol + self.rtol * np.maximum(np.abs(state), np.abs(y5))
            rel_error = np.max(error / scale)
            
            self.last_error = rel_error
            
            if rel_error <= 1.0:
                optimal_dt = dt * 0.9 * (1.0 / rel_error) ** 0.2
                self.dt = np.clip(optimal_dt, self.min_step, self.max_step)
                return y5
            else:
                dt = max(dt * 0.5, self.min_step)
        
        return y5


class ImplicitEulerIntegrator(Integrator):
    def __init__(self, dt=0.01, method='hybr', tol=1e-8):
        super().__init__(dt)
        self.method = method
        self.tol = tol

    def step(self, ode_func, state, action, t):
        def residual(y_next):
            return y_next - state - self.dt * ode_func(y_next, action, t + self.dt)
        
        result = root(residual, state, method=self.method, tol=self.tol)
        return result.x


class ImplicitMidpointIntegrator(Integrator):
    def __init__(self, dt=0.01, method='hybr', tol=1e-8):
        super().__init__(dt)
        self.method = method
        self.tol = tol

    def step(self, ode_func, state, action, t):
        def residual(y_next):
            y_mid = 0.5 * (state + y_next)
            t_mid = t + 0.5 * self.dt
            return y_next - state - self.dt * ode_func(y_mid, action, t_mid)
        
        result = root(residual, state, method=self.method, tol=self.tol)
        return result.x


class TrapezoidalIntegrator(Integrator):
    def __init__(self, dt=0.01, method='hybr', tol=1e-8):
        super().__init__(dt)
        self.method = method
        self.tol = tol

    def step(self, ode_func, state, action, t):
        f_current = ode_func(state, action, t)
        
        def residual(y_next):
            f_next = ode_func(y_next, action, t + self.dt)
            return y_next - state - 0.5 * self.dt * (f_current + f_next)
        
        result = root(residual, state, method=self.method, tol=self.tol)
        return result.x


class RadauIIAIntegrator(Integrator):
    def __init__(self, dt=0.01, method='hybr', tol=1e-8):
        super().__init__(dt)
        self.method = method
        self.tol = tol
        
        self.c = np.array([1/3, 1.0])
        self.a = np.array([
            [5/12, -1/12],
            [3/4, 1/4]
        ])
        self.b = np.array([3/4, 1/4])

    def step(self, ode_func, state, action, t):
        n = len(state)
        
        def residual(z_flat):
            z = z_flat.reshape(2, n)
            k1 = ode_func(state + self.dt * (self.a[0,0] * z[0] + self.a[0,1] * z[1]), 
                         action, t + self.c[0] * self.dt)
            k2 = ode_func(state + self.dt * (self.a[1,0] * z[0] + self.a[1,1] * z[1]), 
                         action, t + self.c[1] * self.dt)
            
            res = np.zeros_like(z_flat)
            res[:n] = z[0] - k1
            res[n:] = z[1] - k2
            return res
        
        z0 = np.zeros(2 * n)
        result = root(residual, z0, method=self.method, tol=self.tol)
        z = result.x.reshape(2, n)
        
        new_state = state + self.dt * (self.b[0] * z[0] + self.b[1] * z[1])
        return new_state


class AdaptiveImplicitIntegrator(Integrator):
    def __init__(self, dt=0.01, atol=1e-6, rtol=1e-6, max_step=1.0, min_step=1e-6):
        super().__init__(dt)
        self.atol = atol
        self.rtol = rtol
        self.max_step = max_step
        self.min_step = min_step
        self.base_integrator = TrapezoidalIntegrator(dt=dt)

    def step(self, ode_func, state, action, t):
        dt = self.dt
        max_attempts = 10
        
        for attempt in range(max_attempts):
            self.base_integrator.dt = dt
            y_full = self.base_integrator.step(ode_func, state, action, t)
            
            self.base_integrator.dt = dt / 2
            y_half = self.base_integrator.step(ode_func, state, action, t)
            y_half2 = self.base_integrator.step(ode_func, y_half, action, t + dt/2)
            
            error = np.abs(y_full - y_half2)
            scale = self.atol + self.rtol * np.maximum(np.abs(state), np.abs(y_full))
            rel_error = np.max(error / scale)
            
            if rel_error <= 1.0:
                optimal_dt = dt * 0.9 * (1.0 / rel_error) ** 0.5
                self.dt = np.clip(optimal_dt, self.min_step, self.max_step)
                return y_half2
            else:
                dt = max(dt * 0.5, self.min_step)
        
        return y_half2


INTEGRATORS = {
    'rk4': RK4Integrator,
    'rk45': AdaptiveRK45Integrator,
    'implicit_euler': ImplicitEulerIntegrator,
    'implicit_midpoint': ImplicitMidpointIntegrator,
    'trapezoidal': TrapezoidalIntegrator,
    'radauIIA': RadauIIAIntegrator,
    'adaptive_implicit': AdaptiveImplicitIntegrator
}


def get_integrator(integrator_type, **kwargs):
    if integrator_type not in INTEGRATORS:
        raise ValueError(f"Unknown integrator type: {integrator_type}. "
                        f"Available types: {list(INTEGRATORS.keys())}")
    return INTEGRATORS[integrator_type](**kwargs)
