import numpy as np
import matplotlib.pyplot as plt
import sys
sys.path.insert(0, 'e:/trae-project/0508-299')

from stiff_systems import ChemicalReactionEnv, StiffOscillatorEnv
from continuous_rl import get_integrator


def plot_integrator_comparison():
    print("Generating integrator comparison plots...")
    
    env_class = ChemicalReactionEnv
    t_max = 0.5
    integrators = ['rk4', 'rk45', 'implicit_euler', 'trapezoidal', 'radauIIA']
    
    results = {}
    
    for int_name in integrators:
        env = env_class(dt=0.005, max_time=t_max, integrator=int_name)
        state = env.reset()
        trajectory = [state.copy()]
        times = [0.0]
        stable = True
        
        try:
            while env.time < t_max:
                action = np.array([0.0], dtype=np.float32)
                state, _, _, _ = env.step(action)
                trajectory.append(state.copy())
                times.append(env.time)
                
                if np.any(np.isnan(state)) or np.any(np.abs(state) > 1e10):
                    stable = False
                    break
        except:
            stable = False
        
        results[int_name] = {
            'trajectory': np.array(trajectory),
            'times': np.array(times),
            'stable': stable
        }
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Integrator Comparison on Stiff Chemical Reaction System', fontsize=16)
    
    colors = plt.cm.tab10(np.linspace(0, 1, len(integrators)))
    
    for idx, int_name in enumerate(integrators):
        res = results[int_name]
        linestyle = '-' if res['stable'] else '--'
        alpha = 1.0 if res['stable'] else 0.5
        
        for i, var_name in enumerate(['A', 'B', 'C']):
            axes[0, i].plot(res['times'], res['trajectory'][:, i], 
                           linestyle, color=colors[idx], 
                           label=f'{int_name}', linewidth=1.5)
        
        axes[1, 0].plot(res['times'][:-1], np.diff(res['times']), 
                       linestyle, color=colors[idx], label=f'{int_name}')
    
    for i, var_name in enumerate(['A', 'B', 'C']):
        axes[0, i].set_xlabel('Time (s)')
        axes[0, i].set_ylabel(f'Concentration {var_name}')
        axes[0, i].set_title(f'Species {var_name}')
        axes[0, i].legend()
        axes[0, i].grid(True, alpha=0.3)
    
    axes[1, 0].set_xlabel('Time (s)')
    axes[1, 0].set_ylabel('Step Size (s)')
    axes[1, 0].set_title('Adaptive Step Sizes')
    axes[1, 0].legend()
    axes[1, 0].grid(True, alpha=0.3)
    
    axes[1, 1].axis('off')
    axes[1, 1].text(0.1, 0.9, 'Legend:', fontsize=14, fontweight='bold')
    for idx, int_name in enumerate(integrators):
        status = 'STABLE' if results[int_name]['stable'] else 'UNSTABLE'
        color = 'green' if results[int_name]['stable'] else 'red'
        axes[1, 1].text(0.1, 0.8 - idx * 0.1, f'• {int_name}: {status}', 
                       fontsize=12, color=color)
    
    axes[1, 1].text(0.1, 0.1, 'Key Observations:', fontsize=12, fontweight='bold')
    axes[1, 1].text(0.1, 0.02, 'Explicit RK4 may diverge on stiff systems\n'
                               'Implicit methods remain stable\n'
                               'Adaptive methods adjust step size automatically',
                   fontsize=10)
    
    plt.tight_layout()
    plt.savefig('stiff_integrator_comparison.png', dpi=300, bbox_inches='tight')
    print("Saved plot to stiff_integrator_comparison.png")
    
    return results


def print_integrator_summary():
    print("\n" + "=" * 70)
    print("INTEGRATOR SUMMARY FOR STIFF DIFFERENTIAL EQUATIONS")
    print("=" * 70)
    
    summary = {
        'rk4': {
            'name': 'Explicit Runge-Kutta 4',
            'stability': 'Conditionally stable (not for stiff systems)',
            'order': '4th order',
            'use_case': 'Non-stiff systems, fast computation',
            'pros': 'Fast, simple, high accuracy for small dt',
            'cons': 'Diverges on stiff systems, requires very small dt'
        },
        'rk45': {
            'name': 'Adaptive Runge-Kutta 4/5 (Dormand-Prince)',
            'stability': 'Better than RK4, but still explicit',
            'order': '5th order (embedded)',
            'use_case': 'Moderately stiff systems',
            'pros': 'Adaptive step size, error control',
            'cons': 'Still explicit, may fail on very stiff systems'
        },
        'implicit_euler': {
            'name': 'Implicit Euler (Backward Euler)',
            'stability': 'A-stable, excellent for stiff systems',
            'order': '1st order',
            'use_case': 'Highly stiff systems, stability critical',
            'pros': 'Unconditionally stable for linear systems',
            'cons': 'Low accuracy, requires solving nonlinear equations'
        },
        'implicit_midpoint': {
            'name': 'Implicit Midpoint Rule',
            'stability': 'A-stable, symplectic',
            'order': '2nd order',
            'use_case': 'Stiff Hamiltonian systems',
            'pros': 'Symplectic, preserves energy',
            'cons': 'Requires solving nonlinear equations'
        },
        'trapezoidal': {
            'name': 'Trapezoidal Rule (Implicit)',
            'stability': 'A-stable',
            'order': '2nd order',
            'use_case': 'Stiff systems requiring good accuracy',
            'pros': 'Good balance of stability and accuracy',
            'cons': 'Requires solving nonlinear equations'
        },
        'radauIIA': {
            'name': 'Radau IIA (Implicit Runge-Kutta)',
            'stability': 'L-stable, excellent for stiff systems',
            'order': '3rd order',
            'use_case': 'Very stiff systems, industrial problems',
            'pros': 'High accuracy, excellent stability properties',
            'cons': 'Most computationally expensive'
        },
        'adaptive_implicit': {
            'name': 'Adaptive Implicit (Trapezoidal)',
            'stability': 'A-stable with step size control',
            'order': '2nd order',
            'use_case': 'Stiff systems with variable time scales',
            'pros': 'Best of both: stability + adaptive step size',
            'cons': 'Higher computational cost'
        }
    }
    
    for key, info in summary.items():
        print(f"\n[{key}] {info['name']}")
        print(f"  Stability:  {info['stability']}")
        print(f"  Order:      {info['order']}")
        print(f"  Use case:   {info['use_case']}")
        print(f"  Pros:       {info['pros']}")
        print(f"  Cons:       {info['cons']}")
    
    print("\n" + "=" * 70)
    print("RECOMMENDATIONS:")
    print("=" * 70)
    print("1. For non-stiff systems: Use RK4 for speed")
    print("2. For moderately stiff systems: Use RK45 with error control")
    print("3. For stiff systems: Use implicit_euler or trapezoidal")
    print("4. For very stiff/high-accuracy needs: Use radauIIA")
    print("5. For stiff systems with varying time scales: Use adaptive_implicit")
    print("=" * 70)


def main():
    print_integrator_summary()
    
    try:
        plot_integrator_comparison()
    except Exception as e:
        print(f"\nPlot generation skipped: {e}")
        print("Install matplotlib and scipy to generate comparison plots")


if __name__ == "__main__":
    main()
