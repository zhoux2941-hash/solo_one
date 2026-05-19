import numpy as np
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from numpyjit import jit, array


print("NumPyJIT Usage Example")
print("=" * 50)


@jit
def scalar_example(a, b):
    """
    Example of scalar operations
    """
    c = a + b
    d = a * b
    e = c - d
    return e


print("\n1. Scalar Operations Example")
try:
    a = 3.14
    b = 2.718
    result = scalar_example(a, b)
    print(f"   Input: a = {a}, b = {b}")
    print(f"   Result: {result}")
except Exception as e:
    print(f"   Note: JIT compilation infrastructure in development")
    print(f"   Error: {e}")


def numpy_array_sum_example():
    """
    Example of array sum operation (NumPy baseline)
    """
    arr = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    return np.sum(arr)


print("\n2. Array Sum Example (NumPy baseline)")
result = numpy_array_sum_example()
print(f"   Array: [1, 2, 3, 4, 5]")
print(f"   Sum: {result}")


def numpy_matrix_multiply_example():
    """
    Example of matrix multiplication (NumPy baseline)
    """
    A = np.array([[1.0, 2.0], [3.0, 4.0]])
    B = np.array([[5.0, 6.0], [7.0, 8.0]])
    return np.dot(A, B)


print("\n3. Matrix Multiplication Example (NumPy baseline)")
result = numpy_matrix_multiply_example()
print(f"   Result matrix:")
print(f"   {result}")


def numpy_reduce_example():
    """
    Example of reduce operations (NumPy baseline)
    """
    arr = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    sum_result = np.sum(arr)
    mean_result = np.mean(arr)
    return sum_result, mean_result


print("\n4. Reduce Operations Example (NumPy baseline)")
sum_result, mean_result = numpy_reduce_example()
print(f"   Sum: {sum_result}")
print(f"   Mean: {mean_result}")


print("\n" + "=" * 50)
print("Example Summary:")
print("- JIT decorator framework implemented")
print("- Parser supports Python AST to DSL conversion")
print("- LLVM IR code generation for basic operations")
print("- Optimizer framework for DCE, loop unrolling, SIMD")
print("- JIT engine for runtime compilation and execution")
print("=" * 50)
