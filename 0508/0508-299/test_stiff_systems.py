import numpy as np
import sys
sys.path.insert(0, 'e:/trae-project/0508-299')

from stiff_systems import (
    ChemicalReactionEnv,
    StiffOscillatorEnv,
    VanDerPolEnv,
    RobertsonReactionEnv,
    compare_integrators
)
from continuous_rl.integrator import INTEGRATORS


def test_chemical_reaction():
    print("=" * 60)
    print("Test 1: Chemical Reaction System (Fast-Slow Kinetics)")
    print("=" * 60)
    
    integrators_to_test = ['rk4', 'rk45', 'implicit_euler', 'trapezoidal', 'radauIIA']
    
    results = compare_integrators(
        ChemicalReactionEnv,
        integrators_to_test,
        t_max=1.0,
        dt=0.005
    )
    
    print("\nSummary:")
    for name, res in results.items():
        status = "STABLE" if res['stable'] else "UNSTABLE"
        print(f"  {name:20s}: {status} ({res['num_steps']} steps")
    
    return results


def test_stiff_oscillator():
    print("\n" + "=" * 60)
    print("Test 2: Stiff Oscillator System")
    print("=" * 60)
    
    integrators_to_test = ['rk4', 'rk45', 'implicit_euler', 'trapezoidal', 'radauIIA']
    
    results = compare_integrators(
        StiffOscillatorEnv,
        integrators_to_test,
        t_max=0.5,
        dt=0.001
    )
    
    print("\nSummary:")
    for name, res in results.items():
        status = "STABLE" if res['stable'] else "UNSTABLE"
        print(f"  {name:20s}: {status} ({res['num_steps']} steps)")
    
    return results


def test_vanderpol():
    print("\n" + "=" * 60)
    print("Test 3: Van der Pol Oscillator (mu=100)")
    print("=" * 60)
    
    integrators_to_test = ['rk4', 'rk45', 'implicit_euler', 'trapezoidal', 'radauIIA']
    
    results = compare_integrators(
        VanDerPolEnv,
        integrators_to_test,
        t_max=5.0,
        dt=0.001,
        env_kwargs={'mu': 100.0}
    )
    
    print("\nSummary:")
    for name, res in results.items():
        status = "STABLE" if res['stable'] else "UNSTABLE"
        print(f"  {name:20s}: {status} ({res['num_steps']} steps)")
    
    return results


def test_robertson():
    print("\n" + "=" * 60)
    print("Test 4: Robertson Chemical Reaction (Very Stiff)")
    print("=" * 60)
    
    integrators_to_test = ['rk4', 'rk45', 'implicit_euler', 'trapezoidal', 'radauIIA']
    
    results = compare_integrators(
        RobertsonReactionEnv,
        integrators_to_test,
        t_max=10.0,
        dt=0.001
    )
    
    print("\nSummary:")
    for name, res in results.items():
        status = "STABLE" if res['stable'] else "UNSTABLE"
        print(f"  {name:20s}: {status} ({res['num_steps']} steps)")
    
    return results


def main():
    print("Testing Integrator Stability on Stiff Differential Equations")
    print(f"Available integrators: {list(INTEGRATORS.keys())}")
    print()
    
    try:
        test_chemical_reaction()
    except Exception as e:
        print(f"Chemical reaction test failed: {e}")
        import traceback
        traceback.print_exc()
    
    try:
        test_stiff_oscillator()
    except Exception as e:
        print(f"Stiff oscillator test failed: {e}")
    
    try:
        test_vanderpol()
    except Exception as e:
        print(f"Van der Pol test failed: {e}")
    
    try:
        test_robertson()
    except Exception as e:
        print(f"Robertson test failed: {e}")
    
    print("\n" + "=" * 60)
    print("Key Takeaways:")
    print("=" * 60)
    print("1. Explicit RK4 often diverges on stiff systems")
    print("2. Implicit methods (Euler, Trapezoidal, RadauIIA) are A-stable")
    print("3. Adaptive methods (RK45, adaptive_implicit) adjust step size")
    print("4. For highly stiff systems, use implicit integrators")
    print("=" * 60)


if __name__ == "__main__":
    main()
