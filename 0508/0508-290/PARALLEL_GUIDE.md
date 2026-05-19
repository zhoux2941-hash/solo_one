# Parallel Execution Guide

This guide explains how to use the parallel execution features in NumPyJIT.

## Overview

NumPyJIT provides several ways to parallelize your code:

1. **Automatic Parallelization**: Matrix multiplication and other operations are
   automatically parallelized when beneficial
2. **@parallel Decorator**: Mark functions for parallel execution
3. **prange Parallel Range**: Parallel for loop iterator
4. **parallel_region Context Manager**: Explicit parallel regions
5. **Direct Parallel Functions**: parallel_for, parallel_reduce, etc.

## 1. Automatic Parallelization

### Matrix Multiplication

Matrix multiplication (`dot`, `matmul`) is automatically parallelized for large
matrices. The system automatically determines if parallelism is beneficial.

```python
import numpy as np
from numpyjit import dot

# Create large matrices
A = np.random.rand(1024, 1024)
B = np.random.rand(1024, 1024)

# Automatically parallelized for large matrices
C = dot(A, B)  # Parallel execution!

# Force serial execution (useful for small matrices)
C_serial = dot(A, B, parallel=False)
```

### When is Parallelization Used?

Parallelization is enabled when:
- Matrix dimensions > threshold (default: based on cache size)
- Sufficient work per thread to justify overhead
- Multiple CPU cores available

The decision is made based on:
```python
# Heuristic: total_work / num_threads > min_work_per_thread
if m * k * n / num_threads > 128 * 128:
    use_parallel = True
```

## 2. @parallel Decorator

### Basic Usage

```python
from numpyjit import parallel, prange

@parallel(num_threads=4)
def process_data(data):
    result = np.zeros_like(data)
    for i in prange(len(data)):  # Parallel loop!
        result[i] = expensive_computation(data[i])
    return result
```

### Without num_threads (Auto-detect)

```python
@parallel()  # Uses all available cores
def parallel_function(arr):
    for i in prange(len(arr)):
        arr[i] = compute(arr[i])
```

## 3. prange (Parallel Range)

### Basic Usage

```python
from numpyjit import parallel, prange

@parallel()
def compute_squares(n):
    squares = []
    for i in prange(n):  # Parallel iteration
        squares.append(i * i)
    return squares
```

### Scheduling Strategies

```python
# Static: Equal chunks (good for uniform work)
for i in prange(1000, schedule='static'):
    work(i)

# Dynamic: Assign work as threads become free (good for variable work)
for i in prange(1000, schedule='dynamic'):
    work(i)

# Guided: Adaptive chunk sizes (starts large, gets smaller)
for i in prange(1000, schedule='guided'):
    work(i)
```

## 4. parallel_region Context Manager

### Explicit Parallel Region

```python
from numpyjit import parallel_region

with parallel_region(num_threads=4) as executor:
    # All parallel operations inside this region use 4 threads

    def compute(i):
        return i * i

    results = executor.parallel_for(compute, 0, 1000)
```

### Multiple Parallel Operations

```python
with parallel_region(num_threads=8) as executor:
    # First parallel operation
    result1 = executor.parallel_for(func1, 0, 1000)

    # Second parallel operation (reuses thread pool)
    result2 = executor.parallel_for(func2, 0, 1000)
```

## 5. Direct Parallel Functions

### parallel_for

Execute a function over a range in parallel:

```python
from numpyjit.parallel import parallel_for

def process_element(i):
    return expensive_computation(i)

# Parallel execution: process_element(0), ..., process_element(999)
results = parallel_for(process_element, 0, 1000)
```

### parallel_reduce

Parallel reduction operations:

```python
from numpyjit.parallel import parallel_reduce

def compute_element(i):
    return data[i]

# Parallel sum reduction
total = parallel_reduce(compute_element, 0, 1000, reducer=sum)

# Or use convenience functions
from numpyjit.parallel import parallel_sum, parallel_mean
total = parallel_sum(large_array)
mean_val = parallel_mean(large_array)
```

## 6. Thread Configuration

### Set Number of Threads

```python
from numpyjit import set_parallel_threads, get_parallel_threads

# Get current thread count
print(f"Current threads: {get_parallel_threads()}")

# Set specific number of threads
set_parallel_threads(4)  # Use 4 threads

# Auto-detect (uses CPU count)
set_parallel_threads(0)
```

### Environment Variables

```bash
# Set default thread count before running Python
export OMP_NUM_THREADS=8
python my_script.py
```

## 7. Performance Considerations

### When to Parallelize

✅ **Good Candidates for Parallelization:**
- Large loops with independent iterations
- Computationally expensive per iteration (>1μs)
- Matrix operations on large arrays (>256x256)
- Reduction operations on large datasets

❌ **Poor Candidates for Parallelization:**
- Small loops (<1000 iterations)
- Very fast per-iteration work
- Operations with many dependencies
- I/O bound operations

### Parallel Overhead

Thread creation and synchronization have overhead:
- Typical overhead: 10-100μs per parallel region
- Amortize overhead with sufficient work

```
Speedup = Serial Time / (Parallel Time + Overhead)
```

### Load Balancing

Choose scheduling based on work distribution:

| Scheduling | Best For | Overhead |
|-----------|----------|----------|
| static | Uniform work | Low |
| dynamic | Variable work | Medium |
| guided | Unknown work distribution | Medium |

## 8. Parallel Matrix Multiplication Details

### Implementation Approach

Our parallel matrix multiplication:

1. **Outer Loop Parallelization**: Each thread processes rows of C
2. **Cache Blocking**: Multi-level tiling for cache efficiency
3. **Register Blocking**: Inner loop unrolling for ILP

```
C = A @ B

Row-wise parallelization:
  Thread 0: C[0:128, :]
  Thread 1: C[128:256, :]
  ...
```

### Performance Expectations

For large matrices (1024x1024) on a 4-core CPU:

- **Ideal Speedup**: 4x
- **Expected Speedup**: 3-3.5x (75-85% efficiency)
- **Limiting Factors**: Memory bandwidth, cache conflicts

## 9. Debugging Parallel Code

### Verify Correctness

Always verify parallel results against serial:

```python
# Compute both ways
result_parallel = parallel_function(data)
result_serial = serial_function(data)

# Verify
np.testing.assert_allclose(result_parallel, result_serial)
```

### Common Issues

1. **Race Conditions**: Ensure iterations are independent
   ```python
   # BAD: Shared variable without synchronization
   total = 0
   for i in prange(n):
       total += arr[i]  # Race condition!

   # GOOD: Use parallel_reduce
   total = parallel_reduce(lambda i: arr[i], 0, n)
   ```

2. **Over-Partitioning**: Too many threads for small work
   ```python
   # BAD: 8 threads for 10 iterations
   set_parallel_threads(8)
   result = parallel_for(work, 0, 10)

   # GOOD: Fewer threads or serial
   set_parallel_threads(2)  # Or just use serial
   ```

3. **False Sharing**: Adjacent array elements on same cache line
   - Mitigated by row-wise parallelization
   - Each thread writes to separate rows

## 10. API Reference

### Decorators

```python
@parallel(num_threads=None)  # Mark function for parallel execution
@auto_parallel(threshold=10000)  # Automatic parallelization
```

### Functions

```python
prange(start, stop=None, step=1, schedule='static')  # Parallel range
parallel_for(func, start, stop, step=1)              # Parallel loop
parallel_reduce(func, start, stop, reducer=sum)      # Parallel reduction
parallel_sum(arr)                                      # Parallel array sum
parallel_mean(arr)                                     # Parallel array mean
```

### Context Managers

```python
parallel_region(num_threads=None)  # Parallel code region
ParallelLoop(num_threads=None)     # OpenMP-style loop context
```

### Configuration

```python
set_parallel_threads(n)  # Set number of threads
get_parallel_threads()   # Get current thread count
```

## 11. Complete Example

```python
import numpy as np
from numpyjit import (
    parallel, prange,
    set_parallel_threads,
    dot,
)

# Configure parallelism
set_parallel_threads(4)

# Example 1: Parallel array processing
@parallel()
def process_array(arr):
    result = np.zeros_like(arr)
    for i in prange(len(arr)):
        x = arr[i]
        result[i] = np.sin(x) * np.exp(-x**2)
    return result

# Example 2: Parallel matrix multiplication
A = np.random.rand(1024, 1024)
B = np.random.rand(1024, 1024)
C = dot(A, B)  # Automatically parallel!

# Run
data = np.random.rand(10000)
result = process_array(data)
print("Parallel processing complete!")
```

## Summary

NumPyJIT provides flexible parallel execution:
- **Automatic parallelism** for matrix operations
- **User-controlled parallelism** via decorators and contexts
- **Multiple scheduling strategies** for different workloads
- **Performance-aware** automatic parallel/serial decision

Choose the right level of parallelism based on your problem!
