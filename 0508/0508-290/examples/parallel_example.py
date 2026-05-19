"""
Examples demonstrating parallel execution features.
"""
import sys
import os
import numpy as np
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from numpyjit import (
    parallel, prange, parallel_region,
    set_parallel_threads, get_parallel_threads,
    dot, matmul,
)
from numpyjit.parallel import (
    parallel_for, parallel_reduce,
    parallel_sum, parallel_mean,
    ParallelExecutor,
    ParallelLoop,
)


def example_1_basic_parallel_for():
    """Example 1: Basic parallel for loop."""
    print("=" * 60)
    print("Example 1: Basic Parallel For Loop")
    print("=" * 60)

    def process_element(i):
        return i * i + 2 * i + 1

    print("\nComputing squares in parallel...")
    results = parallel_for(process_element, 0, 10)

    for i, result in enumerate(results):
        print(f"  f({i}) = {result}")

    print("\n✓ All elements computed successfully!")


def example_2_parallel_sum():
    """Example 2: Parallel sum reduction."""
    print("\n" + "=" * 60)
    print("Example 2: Parallel Sum Reduction")
    print("=" * 60)

    arr = np.arange(1000, dtype=np.float64)

    print(f"\nComputing sum of {len(arr)} elements...")

    start = time.time()
    total_serial = np.sum(arr)
    serial_time = time.time() - start

    start = time.time()
    total_parallel = parallel_sum(arr)
    parallel_time = time.time() - start

    print(f"  Serial sum:   {total_serial:.2f} ({serial_time:.6f}s)")
    print(f"  Parallel sum: {total_parallel:.2f} ({parallel_time:.6f}s)")
    print(f"  Difference:   {abs(total_serial - total_parallel):.2e}")

    if abs(total_serial - total_parallel) < 1e-10:
        print("\n✓ Results match!")


def example_3_parallel_decorator():
    """Example 3: @parallel decorator with prange."""
    print("\n" + "=" * 60)
    print("Example 3: @parallel Decorator with prange")
    print("=" * 60)

    @parallel(num_threads=4)
    def parallel_compute(data):
        """Function with parallel loop."""
        results = np.zeros_like(data)
        for i in prange(len(data)):
            results[i] = np.sin(data[i]) * np.cos(data[i])
        return results

    print("\nComputing trigonometric functions in parallel...")
    data = np.random.rand(1000)

    start = time.time()
    result = parallel_compute(data)
    elapsed = time.time() - start

    print(f"  Computed {len(data)} elements in {elapsed:.4f}s")
    print(f"  Sample result: {result[0]:.6f}")

    print("\n✓ Parallel function executed successfully!")


def example_4_parallel_region():
    """Example 4: parallel_region context manager."""
    print("\n" + "=" * 60)
    print("Example 4: parallel_region Context Manager")
    print("=" * 60)

    print("\nUsing parallel_region for multiple parallel operations...")

    with parallel_region(num_threads=4) as executor:
        def compute_square(i):
            return i * i

        def compute_cube(i):
            return i * i * i

        squares = executor.parallel_for(compute_square, 0, 10)
        cubes = executor.parallel_for(compute_cube, 0, 10)

    for i in range(10):
        print(f"  {i}^2 = {squares[i]}, {i}^3 = {cubes[i]}")

    print("\n✓ Parallel region executed successfully!")


def example_5_matrix_multiplication():
    """Example 5: Parallel matrix multiplication."""
    print("\n" + "=" * 60)
    print("Example 5: Parallel Matrix Multiplication")
    print("=" * 60)

    size = 512
    print(f"\nMultiplying two {size}x{size} matrices...")

    A = np.random.rand(size, size).astype(np.float64)
    B = np.random.rand(size, size).astype(np.float64)

    # NumPy baseline
    start = time.time()
    C_np = A @ B
    np_time = time.time() - start
    np_gflops = (2 * size**3) / (np_time * 1e9)
    print(f"  NumPy:    {np_time:.4f}s, {np_gflops:.2f} GFLOPS")

    # Serial tiled
    start = time.time()
    C_serial = dot(A, B, parallel=False)
    serial_time = time.time() - start
    serial_gflops = (2 * size**3) / (serial_time * 1e9)
    print(f"  Serial:   {serial_time:.4f}s, {serial_gflops:.2f} GFLOPS")

    # Parallel tiled
    start = time.time()
    C_parallel = dot(A, B, parallel=True)
    parallel_time = time.time() - start
    parallel_gflops = (2 * size**3) / (parallel_time * 1e9)
    print(f"  Parallel: {parallel_time:.4f}s, {parallel_gflops:.2f} GFLOPS")

    print(f"\n  Speedup: {serial_time / parallel_time:.2f}x over serial")
    print(f"  Efficiency: {(serial_time / parallel_time) / get_parallel_threads() * 100:.1f}%")

    # Verify
    max_diff = np.max(np.abs(C_parallel - C_np))
    if max_diff < 1e-10:
        print(f"\n✓ Results verified! (max diff: {max_diff:.2e})")


def example_6_thread_configuration():
    """Example 6: Thread configuration."""
    print("\n" + "=" * 60)
    print("Example 6: Thread Configuration")
    print("=" * 60)

    print(f"\nDefault threads: {get_parallel_threads()}")

    set_parallel_threads(2)
    print(f"After setting to 2: {get_parallel_threads()}")

    set_parallel_threads(4)
    print(f"After setting to 4: {get_parallel_threads()}")

    set_parallel_threads(0)  # Auto-detect
    print(f"After auto-detect: {get_parallel_threads()}")

    print("\n✓ Thread configuration works!")


def example_7_parallel_loop():
    """Example 7: ParallelLoop context manager."""
    print("\n" + "=" * 60)
    print("Example 7: ParallelLoop Context Manager")
    print("=" * 60)

    print("\nUsing ParallelLoop for OpenMP-style parallelism...")

    with ParallelLoop(num_threads=4) as p:
        for i in p.range(5):
            print(f"  Thread processing index: {i}")

    print("\n✓ ParallelLoop executed successfully!")


def main():
    print("\n" + "=" * 60)
    print("NumPyJIT Parallel Execution Examples")
    print("=" * 60)
    print(f"\nCPU Cores Available: {os.cpu_count() or 'Unknown'}")
    print(f"Default Parallel Threads: {get_parallel_threads()}")

    try:
        example_1_basic_parallel_for()
        example_2_parallel_sum()
        example_3_parallel_decorator()
        example_4_parallel_region()
        example_5_matrix_multiplication()
        example_6_thread_configuration()
        example_7_parallel_loop()

        print("\n" + "=" * 60)
        print("✓ All examples completed successfully!")
        print("=" * 60)
        print("\nSUMMARY OF PARALLEL FEATURES:")
        print("  1. parallel_for: Parallel loop execution")
        print("  2. parallel_reduce: Parallel reduction (sum, etc.)")
        print("  3. @parallel: Decorator for parallel functions")
        print("  4. prange: Parallel range inside @parallel functions")
        print("  5. parallel_region: Context manager for parallel code")
        print("  6. ParallelLoop: OpenMP-style parallel loop context")
        print("  7. dot/matmul: Auto-parallel matrix multiplication")

    except Exception as e:
        print(f"\n✗ Example failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
