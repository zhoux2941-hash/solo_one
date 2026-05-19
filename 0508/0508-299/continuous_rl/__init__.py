from .ode_env import ODEEnv
from .vehicle_env import AutonomousOvertakeEnv
from .parallel_env import ParallelEnv
from .visualization import Visualizer
from .integrator import (
    Integrator,
    RK4Integrator,
    AdaptiveRK45Integrator,
    ImplicitEulerIntegrator,
    ImplicitMidpointIntegrator,
    TrapezoidalIntegrator,
    RadauIIAIntegrator,
    AdaptiveImplicitIntegrator,
    get_integrator,
    INTEGRATORS
)

try:
    from .onnx_export import (
        TorchIntegrator,
        TorchVehicleDynamics,
        TorchVehicleEnvWrapper,
        ONNXExporter,
        ModelOptimizer,
        create_exportable_env
    )
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False

__all__ = [
    'ODEEnv',
    'AutonomousOvertakeEnv',
    'ParallelEnv',
    'Visualizer',
    'Integrator',
    'RK4Integrator',
    'AdaptiveRK45Integrator',
    'ImplicitEulerIntegrator',
    'ImplicitMidpointIntegrator',
    'TrapezoidalIntegrator',
    'RadauIIAIntegrator',
    'AdaptiveImplicitIntegrator',
    'get_integrator',
    'INTEGRATORS'
]

if ONNX_AVAILABLE:
    __all__.extend([
        'TorchIntegrator',
        'TorchVehicleDynamics',
        'TorchVehicleEnvWrapper',
        'ONNXExporter',
        'ModelOptimizer',
        'create_exportable_env'
    ])

