"""
Benchmark for parallel matrix multiplication.
Compares serial vs parallel performance.
"""
import time
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from numpyjit import dot, set_parallel_threads, get_parallel_threads
from numpyjit.optimize.matmul_optimized import ParallelConfig


def benchmark_size(size, iterations=1):
    """Benchmark matrix multiplication for a specific size."""
    print(f"\n{'=' * 60}")
    print(f"Benchmark: {size} x {size} Matrix Multiplication")
    print(f"{'=' * 60}")

    A = np.random.rand(size, size).astype(np.float64)
    B = np.random.rand(size, size).astype(np.float64)

    # NumPy (BLAS) baseline
    print("\n1. NumPy (BLAS optimized):")
    start = time.time()
    for _ in range(iterations):
        C_np = A @ B
    elapsed_np = time.time() - start
    gflops_np = (2 * size**3 * iterations) / (elapsed_np * 1e9)
    print(f"   Time: {elapsed_np:.4f}s, {gflops_np:.2f} GFLOPS")

    # Serial Tiled
    print("\n2. Serial Tiled:")
    start = time.time()
    for _ in range(iterations):
        C_serial = dot(A, B, parallel=False)
    elapsed_serial = time.time() - start
    gflops_serial = (2 * size**3 * iterations) / (elapsed_serial * 1e9)
    print(f"   Time: {elapsed_serial:.4f}s, {gflops_serial:.2f} GFLOPS")
    print(f"   vs NumPy: {elapsed_np / elapsed_serial:.2f}x")

    # Parallel Tiled
    print(f"\n3. Parallel Tiled ({get_parallel_threads()} threads):")
    start = time.time()
    for _ in range(iterations):
        C_parallel = dot(A, B, parallel=True)
    elapsed_parallel = time.time() - start
    gflops_parallel = (2 * size**3 * iterations) / (elapsed_parallel * 1e9)
    print(f"   Time: {elapsed_parallel:.4f}s, {gflops_parallel:.2f} GFLOPS")
    print(f"   vs NumPy: {elapsed_np / elapsed_parallel:.2f}x")
    print(f"   Speedup over serial: {elapsed_serial / elapsed_parallel:.2f}x")

    # Verify correctness
    np.testing.assert_allclose(C_parallel, C_np, rtol=1e-10, err_msg="Parallel result incorrect!")
    print("   ✓ Results verified")

    return {
        'size': size,
        'numpy_time': elapsed_np,
        'numpy_gflops': gflops_np,
        'serial_time': elapsed_serial,
        'serial_gflops': gflops_serial,
        'parallel_time': elapsed_parallel,
        'parallel_gflops': gflops_parallel,
    }


def benchmark_thread_scaling(size=512):
    """Benchmark scaling with different thread counts."""
    print(f"\n{'=' * 60}")
    print(f"Thread Scaling Benchmark: {size} x {size}")
    print(f"{'=' * 60}")

    A = np.random.rand(size, size).astype(np.float64)
    B = np.random.rand(size, size).astype(np.float64)

    original_threads = get_parallel_threads()

    results = []
    thread_counts = [1, 2, 4, 8]

    for num_threads in thread_counts:
        set_parallel_threads(num_threads)
        ParallelConfig.num_threads = num_threads

        start = time.time()
        C = dot(A, B, parallel=True)
        elapsed = time.time() - start
        gflops = (2 * size**3) / (elapsed * 1e9)

        results.append({
            'threads': num_threads,
            'time': elapsed,
            'gflops': gflops,
        })

        print(f"\n{num_threads} thread(s):")
        print(f"   Time: {elapsed:.4f}s, {gflops:.2f} GFLOPS")

    set_parallel_threads(original_threads)
    ParallelConfig.num_threads = original_threads

    # Calculate speedups
    base_time = results[0]['time']
    print(f"\nSpeedup Summary (vs 1 thread):")
    for r in results:
        speedup = base_time / r['time']
        efficiency = speedup / r['threads'] * 100
        print(f"   {r['threads']}T: {speedup:.2f}x speedup, {efficiency:.1f}% efficiency")

    return results


def main():
    print("=" * 60)
    print("Parallel Matrix Multiplication Benchmark Suite")
    print("=" * 60)
    print(f"\nCPU Cores: {os.cpu_count() or 'Unknown'}")
    print(f"Default Threads: {get_parallel_threads()}")

    all_results = []

    # Small matrix (should be serial)
    all_results.append(benchmark_size(128, iterations=3))

    # Medium matrix
    all_results.append(benchmark_size(512, iterations=2))

    # Large matrix (should benefit most from parallelism)
    all_results.append(benchmark_size(1024, iterations=1))

    # Thread scaling
    scaling_results = benchmark_thread_scaling(512)

    # Summary
    print(f"\n{'=' * 60}")
    print("PERFORMANCE SUMMARY")
    print(f"{'=' * 60}")
    print(f"\n{'Size':>8} | {'Serial':>10} | {'Parallel':>10} | {'Speedup':>8} | {'vs NumPy':>8}")
    print("-" * 55)

    for r in all_results:
        speedup = r['serial_time'] / r['parallel_time']
        vs_numpy = r['numpy_time'] / r['parallel_time']
        print(f"{r['size']:>8} | {r['serial_gflops']:>9.2f} | {r['parallel_gflops']:>9.2f} | {speedup:>7.2f}x | {vs_numpy:>7.2f}x")

    print(f"\n{'=' * 60}")
    print("KEY FINDINGS")
    print(f"{'=' * 60}")
    print("1. Small matrices (< 256x256): Serial is often faster due to")
    print("   thread creation overhead.")
    print("2. Medium matrices (256-512): Parallelism provides good speedup.")
    print("3. Large matrices (> 512x512): Parallelism provides maximum")
    print("   benefit due to high computation-to-overhead ratio.")
    print("4. Ideal thread count: Usually equals number of physical cores.")
    print(f"\n{'=' * 60}")


if __name__ == '__main__':
    main()
