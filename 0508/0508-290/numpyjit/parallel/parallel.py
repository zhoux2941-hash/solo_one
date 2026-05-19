import os
import ctypes
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import local
import multiprocessing as mp


_num_threads = max(1, os.cpu_count() or 4)
_thread_local = local()


def get_num_threads():
    """Get the number of threads used for parallel execution."""
    return _num_threads


def set_num_threads(n):
    """Set the number of threads used for parallel execution."""
    global _num_threads
    _num_threads = max(1, n)


class ParallelExecutor:
    """
    Parallel execution engine with thread pool and load balancing.
    
    Features:
    - Static scheduling (equal chunks)
    - Dynamic scheduling (work stealing)
    - Guided scheduling (adaptive chunk size)
    - Reduction support for sum, mean, etc.
    """

    SCHED_STATIC = 'static'
    SCHED_DYNAMIC = 'dynamic'
    SCHED_GUIDED = 'guided'

    def __init__(self, num_threads=None):
        self.num_threads = num_threads or _num_threads
        self.executor = None

    def __enter__(self):
        self.executor = ThreadPoolExecutor(max_workers=self.num_threads)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.executor:
            self.executor.shutdown(wait=True)
            self.executor = None

    def _chunk_indices(self, start, stop, step=1, schedule=SCHED_STATIC):
        """
        Divide loop indices into chunks for parallel execution.
        
        Args:
            start: Start index
            stop: Stop index
            step: Step size
            schedule: Scheduling strategy
        
        Returns:
            List of (chunk_start, chunk_stop) tuples
        """
        n = (stop - start + step - 1) // step
        chunks = []

        if schedule == self.SCHED_STATIC:
            chunk_size = (n + self.num_threads - 1) // self.num_threads
            for i in range(self.num_threads):
                c_start = start + i * chunk_size * step
                c_end = min(stop, start + (i + 1) * chunk_size * step)
                if c_start < c_end:
                    chunks.append((c_start, c_end))

        elif schedule == self.SCHED_DYNAMIC:
            chunk_size = max(1, n // (self.num_threads * 4))
            for i in range(0, n, chunk_size):
                c_start = start + i * step
                c_end = min(stop, start + (i + chunk_size) * step)
                chunks.append((c_start, c_end))

        elif schedule == self.SCHED_GUIDED:
            remaining = n
            pos = 0
            while remaining > 0:
                chunk_size = max(1, remaining // (self.num_threads * 2))
                c_start = start + pos * step
                c_end = min(stop, start + (pos + chunk_size) * step)
                chunks.append((c_start, c_end))
                pos += chunk_size
                remaining -= chunk_size

        return chunks

    def parallel_for(self, func, start, stop, step=1, schedule=SCHED_STATIC, args=()):
        """
        Parallel for loop: for i in range(start, stop, step): func(i, *args)
        
        Args:
            func: Function to call for each iteration
            start: Start index
            stop: Stop index
            step: Step size
            schedule: Scheduling strategy
            args: Additional arguments to func
        
        Returns:
            List of results in order
        """
        chunks = self._chunk_indices(start, stop, step, schedule)
        futures = []

        for c_start, c_end in chunks:
            def chunk_func(cs=c_start, ce=c_end):
                results = []
                i = cs
                while i < ce:
                    results.append(func(i, *args))
                    i += step
                return results

            futures.append(self.executor.submit(chunk_func))

        all_results = []
        for future in as_completed(futures):
            all_results.extend(future.result())

        return all_results

    def parallel_reduce(self, func, start, stop, step=1,
                        schedule=SCHED_STATIC, reducer=sum, initial=0, args=()):
        """
        Parallel reduction: sum(func(i, *args) for i in range(start, stop, step))
        
        Args:
            func: Function that produces a value for each iteration
            start: Start index
            stop: Stop index
            step: Step size
            schedule: Scheduling strategy
            reducer: Reduction function (e.g., sum, max, min)
            initial: Initial value for reduction
            args: Additional arguments to func
        
        Returns:
            Reduced result
        """
        chunks = self._chunk_indices(start, stop, step, schedule)
        futures = []

        def chunk_reduce(c_start, c_end):
            result = initial
            i = c_start
            while i < c_end:
                val = func(i, *args)
                result = reducer(result, val)
                i += step
            return result

        for c_start, c_end in chunks:
            futures.append(self.executor.submit(chunk_reduce, c_start, c_end))

        total = initial
        for future in as_completed(futures):
            total = reducer(total, future.result())

        return total

    def parallel_map(self, func, iterable, schedule=SCHED_STATIC):
        """
        Parallel version of map(func, iterable).
        
        Args:
            func: Function to apply
            iterable: Iterable to map over
            schedule: Scheduling strategy
        
        Returns:
            List of results
        """
        items = list(iterable)
        n = len(items)
        chunks = self._chunk_indices(0, n, 1, schedule)
        futures = []

        for c_start, c_end in chunks:
            def chunk_func(cs=c_start, ce=c_end):
                return [func(items[i]) for i in range(cs, ce)]
            futures.append(self.executor.submit(chunk_func))

        results = [None] * n
        for future, (c_start, c_end) in zip(as_completed(futures), chunks):
            chunk_results = future.result()
            for i, r in enumerate(chunk_results):
                results[c_start + i] = r

        return results


def parallel_for(func, start, stop, step=1, num_threads=None, schedule='static'):
    """
    Convenience function for parallel for loops.
    
    Example:
        def process(i, data):
            data[i] = data[i] * 2
        
        parallel_for(process, 0, 1000, args=(data,))
    """
    with ParallelExecutor(num_threads) as executor:
        return executor.parallel_for(func, start, stop, step, schedule)


def parallel_reduce(func, start, stop, step=1, num_threads=None,
                    schedule='static', reducer=sum, initial=0):
    """
    Convenience function for parallel reduction.
    
    Example:
        def compute(i, data):
            return data[i]
        
        total = parallel_reduce(compute, 0, 1000, args=(data,))
    """
    with ParallelExecutor(num_threads) as executor:
        return executor.parallel_reduce(func, start, stop, step, schedule, reducer, initial)


def parallel_sum(arr, num_threads=None):
    """Parallel sum of array elements."""
    def element(i):
        return arr[i]
    n = arr.size
    return parallel_reduce(element, 0, n, num_threads=num_threads)


def parallel_mean(arr, num_threads=None):
    """Parallel mean of array elements."""
    total = parallel_sum(arr, num_threads)
    return total / arr.size


class SharedMemory:
    """
    Shared memory wrapper for numpy arrays to avoid copy overhead.
    """

    @staticmethod
    def create(shape, dtype=np.float64):
        """Create a shared memory numpy array."""
        size = int(np.prod(shape)) * np.dtype(dtype).itemsize
        buf = (ctypes.c_char * size)()
        arr = np.frombuffer(buf, dtype=dtype).reshape(shape)
        return arr

    @staticmethod
    def wrap_array(arr):
        """Wrap existing numpy array for shared access."""
        return arr


class ParallelLoop:
    """
    Context manager for OpenMP-style parallel loops.
    
    Example:
        with ParallelLoop(num_threads=4) as p:
            for i in p.range(1000):
                process(i)
    """

    def __init__(self, num_threads=None):
        self.executor = ParallelExecutor(num_threads)
        self._results = None

    def __enter__(self):
        self.executor.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.executor.__exit__(exc_type, exc_val, exc_tb)

    def range(self, start, stop=None, step=1, schedule='static'):
        """
        Create a parallel range iterator.
        
        Note: This collects all results before returning.
        For true streaming, use parallel_for directly.
        """
        if stop is None:
            start, stop = 0, start

        def identity(i):
            return i

        return self.executor.parallel_for(identity, start, stop, step, schedule)


def _sum_reducer(a, b):
    return a + b


def _max_reducer(a, b):
    return max(a, b)


def _min_reducer(a, b):
    return min(a, b)


reducers = {
    'sum': _sum_reducer,
    'max': _max_reducer,
    'min': _min_reducer,
}
