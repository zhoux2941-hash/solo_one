import ctypes
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import os


class ParallelConfig:
    """Configuration for parallel execution."""
    num_threads = max(1, os.cpu_count() or 4)
    min_work_per_thread = 128 * 128  # Minimum work to justify parallelism
    enabled = True

    @classmethod
    def set_num_threads(cls, n):
        cls.num_threads = max(1, n)

    @classmethod
    def should_parallelize(cls, m, k, n):
        """Determine if parallelization is beneficial."""
        if not cls.enabled:
            return False
        total_work = m * k * n
        work_per_thread = total_work // cls.num_threads
        return work_per_thread >= cls.min_work_per_thread


class OptimizedMatrixMultiply:
    """
    Highly optimized matrix multiplication with tiling (blocking) for
    cache efficiency.
    
    Features:
    - 6-level nested loop blocking for L3 cache
    - Register blocking for L1 cache
    - Loop reordering for spatial locality
    - Register accumulation
    """

    BLOCK_SIZE_L3 = 128
    BLOCK_SIZE_L2 = 64
    BLOCK_SIZE_L1 = 32
    REGISTER_BLOCK = 4

    @staticmethod
    def matmul_tiled(A, B, parallel=True):
        """
        Optimized matrix multiplication with multi-level tiling.
        
        C = A @ B
        A: m x k
        B: k x n
        C: m x n
        
        Args:
            A: Left matrix
            B: Right matrix
            parallel: Enable parallel execution (default: True)
        """
        m, k = A.shape
        k_, n = B.shape

        C = np.zeros((m, n), dtype=np.float64)

        if parallel and ParallelConfig.should_parallelize(m, k, n):
            return OptimizedMatrixMultiply._matmul_parallel_tiled(A, B, C, m, k, n)
        else:
            A_ptr = A.ctypes.data_as(ctypes.POINTER(ctypes.c_double))
            B_ptr = B.ctypes.data_as(ctypes.POINTER(ctypes.c_double))
            C_ptr = C.ctypes.data_as(ctypes.POINTER(ctypes.c_double))

            OptimizedMatrixMultiply._matmul_tiled_c(
                A_ptr, B_ptr, C_ptr, m, k, n
            )
            return C

    @staticmethod
    def _matmul_parallel_tiled(A, B, C, m, k, n):
        """
        Parallel tiled matrix multiplication.
        
        Parallelizes the outermost (i) loop. Each thread processes a range
        of rows of the result matrix C. This ensures good load balancing
        and avoids write conflicts (each row written by exactly one thread).
        """
        num_threads = ParallelConfig.num_threads

        row_chunk = max(1, (m + num_threads - 1) // num_threads)

        A_ptr = A.ctypes.data_as(ctypes.POINTER(ctypes.c_double))
        B_ptr = B.ctypes.data_as(ctypes.POINTER(ctypes.c_double))
        C_ptr = C.ctypes.data_as(ctypes.POINTER(ctypes.c_double))

        def process_rows(start_row, end_row):
            """Process rows [start_row, end_row) of C."""
            B1 = OptimizedMatrixMultiply.BLOCK_SIZE_L3
            B2 = OptimizedMatrixMultiply.BLOCK_SIZE_L2
            B3 = OptimizedMatrixMultiply.BLOCK_SIZE_L1

            i0_start = (start_row // B1) * B1
            i0_end = ((end_row + B1 - 1) // B1) * B1

            for i0 in range(i0_start, min(i0_end, m), B1):
                i_end_0 = min(i0 + B1, end_row, m)
                actual_i_start = max(i0, start_row)

                for k0 in range(0, k, B1):
                    k_end_0 = min(k0 + B1, k)
                    for j0 in range(0, n, B1):
                        j_end_0 = min(j0 + B1, n)

                        for i1 in range(i0, i_end_0, B2):
                            i_end_1 = min(i1 + B2, i_end_0)
                            for k1 in range(k0, k_end_0, B2):
                                k_end_1 = min(k1 + B2, k_end_0)
                                for j1 in range(j0, j_end_0, B2):
                                    j_end_1 = min(j1 + B2, j_end_0)

                                    for i in range(i1, i_end_1, B3):
                                        i_end = min(i + B3, i_end_1)
                                        if i_end <= actual_i_start and i >= i_end_1:
                                            continue

                                        for kk in range(k1, k_end_1, B3):
                                            k_end = min(kk + B3, k_end_1)
                                            for j in range(j1, j_end_1, B3):
                                                j_end = min(j + B3, j_end_1)

                                                actual_start = max(i, actual_i_start)
                                                actual_end = min(i_end, end_row)
                                                if actual_start < actual_end:
                                                    OptimizedMatrixMultiply._micro_kernel(
                                                        A_ptr, B_ptr, C_ptr,
                                                        actual_start, kk, j,
                                                        actual_end, k_end, j_end,
                                                        m, k, n
                                                    )

        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = []
            for t in range(num_threads):
                start_row = t * row_chunk
                end_row = min(start_row + row_chunk, m)
                if start_row < end_row:
                    futures.append(executor.submit(process_rows, start_row, end_row))

            for future in futures:
                future.result()

        return C

    @staticmethod
    def _matmul_tiled_c(A_ptr, B_ptr, C_ptr, m, k, n):
        """
        C implementation of tiled matrix multiplication.
        Multi-level tiling: L3 -> L2 -> L1 -> Register
        """
        A = ctypes.cast(A_ptr, ctypes.POINTER(ctypes.c_double))
        B = ctypes.cast(B_ptr, ctypes.POINTER(ctypes.c_double))
        C = ctypes.cast(C_ptr, ctypes.POINTER(ctypes.c_double))

        B1 = OptimizedMatrixMultiply.BLOCK_SIZE_L3
        B2 = OptimizedMatrixMultiply.BLOCK_SIZE_L2
        B3 = OptimizedMatrixMultiply.BLOCK_SIZE_L1

        for i0 in range(0, m, B1):
            i_end_0 = min(i0 + B1, m)
            for k0 in range(0, k, B1):
                k_end_0 = min(k0 + B1, k)
                for j0 in range(0, n, B1):
                    j_end_0 = min(j0 + B1, n)

                    for i1 in range(i0, i_end_0, B2):
                        i_end_1 = min(i1 + B2, i_end_0)
                        for k1 in range(k0, k_end_0, B2):
                            k_end_1 = min(k1 + B2, k_end_0)
                            for j1 in range(j0, j_end_0, B2):
                                j_end_1 = min(j1 + B2, j_end_0)

                                for i in range(i1, i_end_1, B3):
                                    i_end = min(i + B3, i_end_1)
                                    for kk in range(k1, k_end_1, B3):
                                        k_end = min(kk + B3, k_end_1)
                                        for j in range(j1, j_end_1, B3):
                                            j_end = min(j + B3, j_end_1)

                                            OptimizedMatrixMultiply._micro_kernel(
                                                A, B, C,
                                                i, kk, j,
                                                i_end, k_end, j_end,
                                                m, k, n
                                            )

    @staticmethod
    def _micro_kernel(A, B, C, i_start, k_start, j_start,
                      i_end, k_end, j_end, m, k, n):
        """
        Micro-kernel for the innermost loop.
        Uses register blocking and loop unrolling.
        """
        RB = OptimizedMatrixMultiply.REGISTER_BLOCK

        for i in range(i_start, i_end):
            row_a = i * k
            row_c = i * n

            for kk in range(k_start, k_end):
                a_val = A[row_a + kk]
                col_b = kk * n

                j = j_start
                while j + RB <= j_end:
                    C[row_c + j] += a_val * B[col_b + j]
                    C[row_c + j + 1] += a_val * B[col_b + j + 1]
                    C[row_c + j + 2] += a_val * B[col_b + j + 2]
                    C[row_c + j + 3] += a_val * B[col_b + j + 3]
                    j += RB

                while j < j_end:
                    C[row_c + j] += a_val * B[col_b + j]
                    j += 1


def create_optimized_matmul_runtime():
    """
    Create the optimized matrix multiplication runtime function.
    """
    def runtime_matmul_optimized(A_ptr, B_ptr, m, k, n):
        """
        Runtime function for JIT. This is the C-callable version.
        
        C = A @ B
        
        A: m x k (row-major)
        B: k x n (row-major)
        Returns: C pointer (m x n)
        """
        A = ctypes.cast(A_ptr, ctypes.POINTER(ctypes.c_double))
        B = ctypes.cast(B_ptr, ctypes.POINTER(ctypes.c_double))

        result_size = m * n * 8
        result_ptr = ctypes.CDLL(None).malloc(result_size)
        C = ctypes.cast(result_ptr, ctypes.POINTER(ctypes.c_double))

        for i in range(m):
            row_c = i * n
            for j in range(n):
                C[row_c + j] = 0.0

        BLOCK_SIZE = 64

        B1 = 128
        B2 = 64
        B3 = 32

        for i0 in range(0, m, B1):
            i_end_0 = min(i0 + B1, m)
            for k0 in range(0, k, B1):
                k_end_0 = min(k0 + B1, k)
                for j0 in range(0, n, B1):
                    j_end_0 = min(j0 + B1, n)

                    for i1 in range(i0, i_end_0, B2):
                        i_end_1 = min(i1 + B2, i_end_0)
                        for k1 in range(k0, k_end_0, B2):
                            k_end_1 = min(k1 + B2, k_end_0)
                            for j1 in range(j0, j_end_0, B2):
                                j_end_1 = min(j1 + B2, j_end_0)

                                for i in range(i1, i_end_1, B3):
                                    i_end = min(i + B3, i_end_1)
                                    for kk in range(k1, k_end_1, B3):
                                        k_end = min(kk + B3, k_end_1)
                                        for j in range(j1, j_end_1, B3):
                                            j_end = min(j + B3, j_end_1)

                                            for ii in range(i, i_end):
                                                row_a = ii * k
                                                row_c = ii * n
                                                for kk_inner in range(kk, k_end):
                                                    a_val = A[row_a + kk_inner]
                                                    col_b = kk_inner * n
                                                    for jj in range(j, j_end):
                                                        C[row_c + jj] += a_val * B[col_b + jj]

        return result_ptr

    return runtime_matmul_optimized
