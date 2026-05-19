import time
import numpy as np
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from numpyjit import jit, array


def benchmark_scalar_operations():
    print("=" * 60)
    print("Benchmark: Scalar Operations")
    print("=" * 60)

    def python_scalar(a, b):
        result = 0.0
        for i in range(1000000):
            result += a * b + a - b
        return result

    @jit
    def jit_scalar(a, b):
        result = 0.0
        for i in range(1000000):
            result += a * b + a - b
        return result

    a = 3.14
    b = 2.718

    start = time.time()
    py_result = python_scalar(a, b)
    py_time = time.time() - start
    print(f"Python: {py_time:.4f}s, result = {py_result}")

    try:
        start = time.time()
        jit_result = jit_scalar(a, b)
        jit_time = time.time() - start
        print(f"JIT: {jit_time:.4f}s, result = {jit_result}")
        speedup = py_time / jit_time
        print(f"Speedup: {speedup:.2f}x")
    except Exception as e:
        print(f"JIT failed: {e}")

    print()


def benchmark_array_sum():
    print("=" * 60)
    print("Benchmark: Array Sum")
    print("=" * 60)

    size = 1000000
    arr = np.random.rand(size)

    def python_sum(arr):
        total = 0.0
        for i in range(len(arr)):
            total += arr[i]
        return total

    start = time.time()
    py_result = python_sum(arr)
    py_time = time.time() - start
    print(f"Python loop: {py_time:.4f}s, sum = {py_result}")

    start = time.time()
    np_result = np.sum(arr)
    np_time = time.time() - start
    print(f"NumPy: {np_time:.4f}s, sum = {np_result}")

    print(f"NumPy speedup over Python: {py_time / np_time:.2f}x")
    print()


def benchmark_matrix_multiplication():
    print("=" * 60)
    print("Benchmark: Matrix Multiplication")
    print("=" * 60)

    size = 256
    A = np.random.rand(size, size)
    B = np.random.rand(size, size)

    def python_matmul(A, B):
        n = A.shape[0]
        m = B.shape[1]
        k = A.shape[1]
        C = np.zeros((n, m))
        for i in range(n):
            for j in range(m):
                for l in range(k):
                    C[i, j] += A[i, l] * B[l, j]
        return C

    start = time.time()
    np_result = np.dot(A, B)
    np_time = time.time() - start
    print(f"NumPy: {np_time:.4f}s")

    print()


def benchmark_reduce_operations():
    print("=" * 60)
    print("Benchmark: Reduce Operations (sum, mean)")
    print("=" * 60)

    size = 1000000
    arr = np.random.rand(size)

    operations = [
        ("sum", np.sum),
        ("mean", np.mean),
    ]

    for name, op in operations:
        start = time.time()
        result = op(arr)
        elapsed = time.time() - start
        print(f"{name}: {elapsed:.4f}s, result = {result}")

    print()


def run_all_benchmarks():
    print("\n" + "=" * 60)
    print("NumPyJIT Performance Benchmarks")
    print("=" * 60 + "\n")

    benchmark_scalar_operations()
    benchmark_array_sum()
    benchmark_matrix_multiplication()
    benchmark_reduce_operations()

    print("=" * 60)
    print("Benchmark Summary")
    print("=" * 60)
    print("Target: Achieve 80% of hand-written C performance")
    print("Current: NumPy serves as baseline reference")
    print()


if __name__ == '__main__':
    run_all_benchmarks()
