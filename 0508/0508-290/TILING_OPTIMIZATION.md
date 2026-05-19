# Matrix Multiplication Tiling (Blocking) Optimization

## Problem

For large matrices (e.g., 1024x1024), naive triple-loop matrix multiplication suffers from **severe cache misses** because:

1. **Spatial locality**: B matrix is accessed by columns (B[k, j]), causing stride-n access
2. **Temporal locality**: Full matrices are too large to fit in CPU caches
3. **Result**: Most memory accesses go to slow DRAM instead of fast caches

## Solution: Loop Tiling (Blocking)

### Before (Naive)
```python
for i in range(m):
    for j in range(n):
        sum_val = 0.0
        for k in range(k_size):
            sum_val += A[i, k] * B[k, j]  # B[k, j] strides by n!
        C[i, j] = sum_val
```

### After (Tiled)
```python
BLOCK_SIZE = 64  # Fits in L1 cache

# Outer tile loops (iterate over blocks)
for i0 in range(0, m, BLOCK_SIZE):
    for k0 in range(0, k, BLOCK_SIZE):
        for j0 in range(0, n, BLOCK_SIZE):

            # Inner loops: work on small block that fits in cache
            for i in range(i0, min(i0 + BLOCK_SIZE, m)):
                for kk in range(k0, min(k0 + BLOCK_SIZE, k)):
                    a_val = A[i, kk]
                    for j in range(j0, min(j0 + BLOCK_SIZE, n)):
                        C[i, j] += a_val * B[kk, j]
```

## Cache Hierarchy Optimization

### Block Size Selection

| Cache Level | Typical Size | Doubles Held | Recommended Block Size |
|-------------|--------------|--------------|------------------------|
| L1          | 32KB         | 4,096        | 32-64                  |
| L2          | 256KB        | 32,768       | 64-128                 |
| L3          | 8MB+         | 1,048,576    | 256-512                |

### Multi-Level Blocking

For very large matrices (> 512x512), use **multi-level blocking** to match
the cache hierarchy:

```
L3 block: 128 -> L2 block: 64 -> L1 block: 32 -> Register block: 4
```

## Performance Improvement

### Theoretical Analysis

- **Naive**: O(n³) cache misses, each element accessed n times
- **Tiled**: O(n³ / B) cache misses, each block accessed B times

**Miss reduction factor**: ~B (block size)

With B = 64, we get **~64x fewer cache misses**!

### Register Blocking

Additional optimization: unroll innermost loop to keep values in registers:

```python
j = j0
while j + 4 <= j_end:
    C[i,j]   += a_val * B[kk,j]
    C[i,j+1] += a_val * B[kk,j+1]
    C[i,j+2] += a_val * B[kk,j+2]
    C[i,j+3] += a_val * B[kk,j+3]
    j += 4
```

This reduces:
- Memory load operations (a_val loaded once, used 4 times)
- Loop overhead (fewer iterations)

## Implementation in NumPyJIT

### Files Modified

1. **`numpyjit/jit/engine.py`**:
   - `runtime_matmul()`: Implements adaptive tiling with automatic block size selection
   - Block size chosen based on matrix dimensions:
     - Small (<=128): block size = 32
     - Medium (<=512): block size = 64
     - Large (>512): block size = 128
   - Register blocking (factor 4) in innermost loop

2. **`numpyjit/optimize/matmul_optimized.py`**:
   - `OptimizedMatrixMultiply` class with multi-level blocking
   - `LoopTilingOptimizer` class for LLVM IR level optimization

3. **`numpyjit/optimize/optimizer.py`**:
   - Added `LoopTilingOptimizer` to detect and tile nested loops
   - Integrated into optimization pipeline

### Benchmark

Run the benchmark to see the improvement:

```bash
python benchmarks/matmul_benchmark.py
```

### Expected Results

For 1024x1024 matrices:
- **Naive**: Very slow (seconds to minutes)
- **Tiled**: Significant speedup (~10-50x faster than naive)
- **NumPy**: Best (BLAS optimized, assembler level)

## Loop Order Optimization

### Original Order (i, j, k)
```python
for i:
    for j:
        for k:
            C[i,j] += A[i,k] * B[k,j]
```
- A: row-wise access ✓
- B: column-wise access ✗ (bad stride!)
- C: row-wise access ✓

### Optimized Order (i, k, j)
```python
for i:
    for k:
        a_val = A[i,k]
        for j:
            C[i,j] += a_val * B[k,j]
```
- A: row-wise access ✓
- B: row-wise access ✓ (now B[k,:]!)
- C: row-wise access ✓

**This is already included in our tiled implementation!**

## Additional Optimizations Considered

### 1. SIMD Vectorization
- Use AVX instructions to compute 4 elements at once
- Requires aligned memory and specialized code generation

### 2. Loop Unrolling
- Unroll the j-loop by factor 4 or 8
- Reduce loop overhead and improve ILP (Instruction Level Parallelism)

### 3. Prefetching
- Software prefetch of next cache line
- `_mm_prefetch` intrinsics

### 4. Copy Optimization
- Pack blocks into contiguous memory to eliminate strides
- Additional memory overhead but better access patterns

## Verification

All implementations are verified against NumPy results:
```python
np.testing.assert_allclose(C_tiled, C_numpy, rtol=1e-10)
```

This ensures numerical correctness while achieving performance gains.

## References

1. **Cache-Oblivious Algorithms** - Frigo, Leiserson, Prokop, Ramachandran (1999)
2. **Automated Empirical Optimizations of Software** - ATLAS project
3. **Intel Architecture Optimization Reference Manual**
4. **Computer Architecture: A Quantitative Approach** - Hennessy & Patterson
