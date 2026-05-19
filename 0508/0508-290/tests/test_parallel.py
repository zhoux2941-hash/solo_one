"""
Tests for parallel execution features.
"""
import sys
import os
import time
import numpy as np

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
)


def test_parallel_for_basic():
    """Test basic parallel for loop."""
    print("Test: Basic parallel for loop...")

    def square(i):
        return i * i

    results = parallel_for(square, 0, 100)

    assert len(results) == 100
    for i in range(100):
        assert results[i] == i * i

    print("  ✓ Passed")


def test_parallel_reduce_sum():
    """Test parallel reduction for summation."""
    print("Test: Parallel reduction sum...")

    arr = np.arange(1000, dtype=np.float64)

    def element(i):
        return arr[i]

    total = parallel_reduce(element, 0, 1000)
    expected = np.sum(arr)

    assert abs(total - expected) < 1e-10
    print("  ✓ Passed")


def test_parallel_sum_array():
    """Test parallel sum of array."""
    print("Test: Parallel sum array...")

    arr = np.random.rand(10000)
    total_parallel = parallel_sum(arr)
    total_serial = np.sum(arr)

    assert abs(total_parallel - total_serial) < 1e-10
    print("  ✓ Passed")


def test_parallel_mean_array():
    """Test parallel mean of array."""
    print("Test: Parallel mean array...")

    arr = np.random.rand(10000)
    mean_parallel = parallel_mean(arr)
    mean_serial = np.mean(arr)

    assert abs(mean_parallel - mean_serial) < 1e-10
    print("  ✓ Passed")


def test_parallel_decorator():
    """Test @parallel decorator."""
    print("Test: @parallel decorator...")

    @parallel(num_threads=2)
    def parallel_function(n):
        total = 0
        for i in prange(n):
            total += i
        return total

    result = parallel_function(100)
    expected = sum(range(100))

    assert result == expected
    print("  ✓ Passed")


def test_parallel_region_context():
    """Test parallel_region context manager."""
    print("Test: parallel_region context...")

    with parallel_region(num_threads=2) as executor:
        def compute(i):
            return i * 2

        results = executor.parallel_for(compute, 0, 50)

    assert len(results) == 50
    for i in range(50):
        assert results[i] == i * 2

    print("  ✓ Passed")


def test_thread_configuration():
    """Test setting and getting thread count."""
    print("Test: Thread configuration...")

    original = get_parallel_threads()

    set_parallel_threads(2)
    assert get_parallel_threads() == 2

    set_parallel_threads(4)
    assert get_parallel_threads() == 4

    set_parallel_threads(original)
    print("  ✓ Passed")


def test_scheduling_strategies():
    """Test different scheduling strategies."""
    print("Test: Scheduling strategies...")

    def work(i):
        return i * i

    for schedule in ['static', 'dynamic', 'guided']:
        results = parallel_for(work, 0, 100, schedule=schedule)
        assert len(results) == 100
        for i in range(100):
            assert results[i] == i * i

    print("  ✓ Passed")


def main():
    print("=" * 60)
    print("Parallel Execution Test Suite")
    print("=" * 60)

    try:
        test_parallel_for_basic()
        test_parallel_reduce_sum()
        test_parallel_sum_array()
        test_parallel_mean_array()
        test_parallel_decorator()
        test_parallel_region_context()
        test_thread_configuration()
        test_scheduling_strategies()

        print("\n" + "=" * 60)
        print("✓ All parallel tests passed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
