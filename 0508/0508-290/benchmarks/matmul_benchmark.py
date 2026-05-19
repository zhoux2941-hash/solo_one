"""
Matrix Multiplication Benchmark
Compares naive vs tiled matrix multiplication performance.
"""
import time
import numpy as np
import ctypes
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def matmul_naive(A, B):
    """Naive triple-loop matrix multiplication."""
    m, k = A.shape
    k_, n = B.shape

    C = np.zeros((m, n), dtype=np.float64)

    for i in range(m):
        for j in range(n):
            s = 0.0
            for l in range(k):
                s += A[i, l] * B[l, j]
            C[i, j] = s

    return C


def matmul_tiled(A, B, block_size=64):
    """
    Tiled (blocked) matrix multiplication.
    
    Blocking improves cache locality by working on smaller submatrices
    that fit into CPU caches.
    """
    m, k = A.shape
    k_, n = B.shape

    C = np.zeros((m, n), dtype=np.float64)

    for i0 in range(0, m, block_size):
        i_end = min(i0 + block_size, m)
        for k0 in range(0, k, block_size):
            k_end = min(k0 + block_size, k)
            for j0 in range(0, n, block_size):
                j_end = min(j0 + block_size, n)

                for i in range(i0, i_end):
                    for kk in range(k0, k_end):
                        a_val = A[i, kk]
                        for j in range(j0, j_end):
                            C[i, j] += a_val * B[kk, j]

    return C


def matmul_tiled_register(A, B, block_size=64, reg_block=4):
    """
    Tiled matrix multiplication with register blocking.
    
    Additional optimization: unroll innermost loop to use
    registers more efficiently.
    """
    m, k = A.shape
    k_, n = B.shape

    C = np.zeros((m, n), dtype=np.float64)

    for i0 in range(0, m, block_size):
        i_end = min(i0 + block_size, m)
        for k0 in range(0, k, block_size):
            k_end = min(k0 + block_size, k)
            for j0 in range(0, n, block_size):
                j_end = min(j0 + block_size, n)

                for i in range(i0, i_end):
                    for kk in range(k0, k_end):
                        a_val = A[i, kk]

                        j = j0
                        while j + reg_block <= j_end:
                            C[i, j] += a_val * B[kk, j]
                            C[i, j + 1] += a_val * B[kk, j + 1]
                            C[i, j + 2] += a_val * B[kk, j + 2]
                            C[i, j + 3] += a_val * B[kk, j + 3]
                            j += reg_block

                        while j < j_end:
                            C[i, j] += a_val * B[kk, j]
                            j += 1

    return C


def matmul_multi_level(A, B):
    """
    Multi-level blocking for large matrices.
    
    Uses different block sizes for L1, L2, L3 caches.
    """
    m, k = A.shape
    k_, n = B.shape

    C = np.zeros((m, n), dtype=np.float64)

    B3 = 128
    B2 = 64
    B1 = 32

    for i0 in range(0, m, B3):
        i_end_0 = min(i0 + B3, m)
        for k0 in range(0, k, B3):
            k_end_0 = min(k0 + B3, k)
            for j0 in range(0, n, B3):
                j_end_0 = min(j0 + B3, n)

                for i1 in range(i0, i_end_0, B2):
                    i_end_1 = min(i1 + B2, i_end_0)
                    for k1 in range(k0, k_end_0, B2):
                        k_end_1 = min(k1 + B2, k_end_0)
                        for j1 in range(j0, j_end_0, B2):
                            j_end_1 = min(j1 + B2, j_end_0)

                            for i in range(i1, i_end_1, B1):
                                i_end = min(i + B1, i_end_1)
                                for kk in range(k1, k_end_1, B1):
                                    k_end = min(kk + B1, k_end_1)
                                    for j in range(j1, j_end_1, B1):
                                        j_end = min(j + B1, j_end_1)

                                        for ii in range(i, i_end):
                                            for kk_inner in range(kk, k_end):
                                                a_val = A[ii, kk_inner]
                                                for jj in range(j, j_end):
                                                    C[ii, jj] += a_val * B[kk_inner, jj]

    return C


def benchmark(size=256, iterations=1):
    """Benchmark different matrix multiplication implementations."""
    print(f"\n{'='*60}")
    print(f"Matrix Multiplication Benchmark: {size}x{size}")
    print(f"{'='*60}")

    A = np.random.rand(size, size).astype(np.float64)
    B = np.random.rand(size, size).astype(np.float64)

    results = {}

    print("\n1. NumPy (BLAS optimized):")
    start = time.time()
    for _ in range(iterations):
        C_np = A @ B
    elapsed = time.time() - start
    gflops = (2 * size**3 * iterations) / (elapsed * 1e9)
    print(f"   Time: {elapsed:.4f}s, {gflops:.2f} GFLOPS")
    results['numpy'] = {'time': elapsed, 'gflops': gflops, 'result': C_np}

    if size <= 128:
        print("\n2. Naive implementation:")
        start = time.time()
        for _ in range(iterations):
            C_naive = matmul_naive(A, B)
        elapsed = time.time() - start
        gflops = (2 * size**3 * iterations) / (elapsed * 1e9)
        print(f"   Time: {elapsed:.4f}s, {gflops:.2f} GFLOPS")
        speedup = results['numpy']['time'] / elapsed
        print(f"   vs NumPy: {speedup:.2f}x slower")
        results['naive'] = {'time': elapsed, 'gflops': gflops}

    print("\n3. Tiled (block size=64):")
    start = time.time()
    for _ in range(iterations):
        C_tiled = matmul_tiled(A, B, 64)
    elapsed = time.time() - start
    gflops = (2 * size**3 * iterations) / (elapsed * 1e9)
    print(f"   Time: {elapsed:.4f}s, {gflops:.2f} GFLOPS")
    speedup = results['numpy']['time'] / elapsed
    print(f"   vs NumPy: {speedup:.2f}x slower")
    results['tiled'] = {'time': elapsed, 'gflops': gflops}
    np.testing.assert_allclose(C_tiled, C_np, rtol=1e-10, err_msg="Tiled result incorrect!")

    print("\n4. Tiled + Register blocking:")
    start = time.time()
    for _ in range(iterations):
        C_reg = matmul_tiled_register(A, B, 64, 4)
    elapsed = time.time() - start
    gflops = (2 * size**3 * iterations) / (elapsed * 1e9)
    print(f"   Time: {elapsed:.4f}s, {gflops:.2f} GFLOPS")
    speedup = results['numpy']['time'] / elapsed
    print(f"   vs NumPy: {speedup:.2f}x slower")
    results['tiled_reg'] = {'time': elapsed, 'gflops': gflops}
    np.testing.assert_allclose(C_reg, C_np, rtol=1e-10, err_msg="Tiled+Reg result incorrect!")

    if size >= 512:
        print("\n5. Multi-level blocking (L3/L2/L1):")
        start = time.time()
        for _ in range(iterations):
            C_multi = matmul_multi_level(A, B)
        elapsed = time.time() - start
        gflops = (2 * size**3 * iterations) / (elapsed * 1e9)
        print(f"   Time: {elapsed:.4f}s, {gflops:.2f} GFLOPS")
        speedup = results['numpy']['time'] / elapsed
        print(f"   vs NumPy: {speedup:.2f}x slower")
        results['multi_level'] = {'time': elapsed, 'gflops': gflops}
        np.testing.assert_allclose(C_multi, C_np, rtol=1e-10, err_msg="Multi-level result incorrect!")

    if size <= 128 and 'naive' in results and 'tiled' in results:
        improvement = (results['naive']['time'] - results['tiled']['time']) / results['naive']['time'] * 100
        print(f"\nTiling improvement over naive: {improvement:.1f}% faster")

    return results


def analyze_cache_effects():
    """Analyze cache behavior with different block sizes."""
    print(f"\n{'='*60}")
    print("Cache Effect Analysis: Block Size Impact")
    print(f"{'='*60}")

    size = 512
    A = np.random.rand(size, size).astype(np.float64)
    B = np.random.rand(size, size).astype(np.float64)

    block_sizes = [16, 32, 64, 128, 256]
    times = []

    print(f"\nMatrix: {size}x{size}")
    print("\nBlock Size | Time (s) | GFLOPS")
    print("-" * 35)

    for bs in block_sizes:
        start = time.time()
        C = matmul_tiled(A, B, bs)
        elapsed = time.time() - start
        gflops = (2 * size**3) / (elapsed * 1e9)
        print(f"{bs:10d} | {elapsed:8.4f} | {gflops:6.2f}")
        times.append(elapsed)

    best_idx = times.index(min(times))
    print(f"\nOptimal block size for {size}x{size}: {block_sizes[best_idx]}")
    print("Note: Optimal size depends on CPU cache sizes")


def main():
    print("Matrix Multiplication Optimization Benchmark")
    print("=" * 60)
    print("\nCache sizes (typical):")
    print("  L1: ~32KB   -> holds ~4K doubles    -> tile: 64x64")
    print("  L2: ~256KB  -> holds ~32K doubles   -> tile: 128x128")
    print("  L3: ~8MB+   -> holds ~1M doubles    -> tile: 512x512")
    print("\n" + "=" * 60)

    results_small = benchmark(128, iterations=2)

    results_medium = benchmark(512, iterations=1)

    results_large = benchmark(1024, iterations=1)

    analyze_cache_effects()

    print(f"\n{'='*60}")
    print("SUMMARY: Tiling Optimization Benefits")
    print(f"{'='*60}")
    print("1. Reduces cache misses by working on small submatrices")
    print("2. Improves spatial locality by consecutive memory access")
    print("3. Register blocking further reduces memory operations")
    print("4. Multi-level blocking matches cache hierarchy")
    print("\nFor 1024x1024 matrices:")
    print("  - Without tiling: O(n^3) cache misses")
    print("  - With tiling:    O(n^3 / B) cache misses")
    print("  - Where B is block size (typical 64-128)")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
