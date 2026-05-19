import ast
import numpy as np
from functools import wraps


class LoopAnalyzer(ast.NodeVisitor):
    """
    Analyze Python AST to detect loops that can be parallelized.
    
    Features:
    - Detect loop-carried dependencies
    - Identify reduction operations (sum, max, min)
    - Estimate loop workload
    - Check for thread-safe operations
    """

    def __init__(self):
        self.loop_info = []
        self.current_loop = None
        self.variable_writes = set()
        self.variable_reads = set()
        self.reduction_vars = set()

    def visit_For(self, node):
        """Analyze a for loop for parallelization potential."""
        parent_writes = self.variable_writes.copy()
        parent_reads = self.variable_reads.copy()

        self.variable_writes = set()
        self.variable_reads = set()
        self.reduction_vars = set()

        self.generic_visit(node)

        loop_var = node.target.id if isinstance(node.target, ast.Name) else None

        has_dependencies = self._check_dependencies(loop_var)
        is_reduction = len(self.reduction_vars) > 0
        workload_estimate = self._estimate_workload(node)

        loop_info = {
            'node': node,
            'loop_var': loop_var,
            'can_parallelize': not has_dependencies,
            'is_reduction': is_reduction,
            'reduction_vars': list(self.reduction_vars),
            'workload': workload_estimate,
            'written_vars': list(self.variable_writes),
            'read_vars': list(self.variable_reads),
        }

        self.loop_info.append(loop_info)

        self.variable_writes = parent_writes | self.variable_writes
        self.variable_reads = parent_reads | self.variable_reads

    def visit_While(self, node):
        """While loops are generally not parallelizable."""
        self.loop_info.append({
            'node': node,
            'can_parallelize': False,
            'reason': 'while loops cannot be reliably parallelized',
        })
        self.generic_visit(node)

    def visit_AugAssign(self, node):
        """Detect augmented assignments (potential reductions)."""
        if isinstance(node.target, ast.Name):
            var_name = node.target.id
            self.variable_writes.add(var_name)

            if isinstance(node.op, (ast.Add, ast.Sub)):
                if isinstance(node.value, (ast.Num, ast.Constant, ast.Name)):
                    self.reduction_vars.add(var_name)

        self.generic_visit(node)

    def visit_Assign(self, node):
        """Track variable assignments."""
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.variable_writes.add(target.id)
            elif isinstance(target, ast.Subscript):
                if isinstance(target.value, ast.Name):
                    self.variable_writes.add(target.value.id)

        self.generic_visit(node)

    def visit_Name(self, node):
        """Track variable reads."""
        if isinstance(node.ctx, ast.Load):
            self.variable_reads.add(node.id)

    def _check_dependencies(self, loop_var):
        """Check for loop-carried dependencies."""
        common_vars = self.variable_writes & self.variable_reads

        for var in common_vars:
            if var != loop_var and var not in self.reduction_vars:
                return True

        return False

    def _estimate_workload(self, node):
        """Estimate the workload inside a loop."""
        complexity = 0
        for _ in ast.walk(node):
            complexity += 1
        return complexity


class AutoParallelizer:
    """
    Automatic parallelization analyzer and transformer.
    
    Analyzes functions and automatically parallelizes loops that:
    1. Have no loop-carried dependencies
    2. Are large enough to justify parallelism overhead
    3. Perform reduction operations or independent iterations
    """

    DEFAULT_THRESHOLD = 10000
    DEFAULT_MIN_ITERATIONS = 1000

    def __init__(self, threshold=None, min_iterations=None):
        self.threshold = threshold or self.DEFAULT_THRESHOLD
        self.min_iterations = min_iterations or self.DEFAULT_MIN_ITERATIONS

    def analyze_function(self, func):
        """
        Analyze a function to find parallelizable loops.
        
        Returns:
            List of loop information dictionaries
        """
        try:
            source = inspect.getsource(func)
            tree = ast.parse(source)

            analyzer = LoopAnalyzer()
            analyzer.visit(tree)

            return analyzer.loop_info
        except:
            return []

    def should_parallelize_loop(self, loop_info, iterable_size=None):
        """
        Determine if a loop should be parallelized.
        
        Decision criteria:
        1. No loop-carried dependencies
        2. Sufficient workload per iteration
        3. Large enough iteration count
        """
        if not loop_info.get('can_parallelize', False):
            return False

        if iterable_size is not None:
            if iterable_size < self.min_iterations:
                return False

        workload = loop_info.get('workload', 0)
        total_work = workload * (iterable_size or self.min_iterations)

        return total_work >= self.threshold

    def suggest_schedule(self, loop_info):
        """
        Suggest the best scheduling strategy for a loop.
        
        Returns:
            'static', 'dynamic', or 'guided'
        """
        workload = loop_info.get('workload', 0)
        is_reduction = loop_info.get('is_reduction', False)

        if is_reduction:
            return 'static'
        elif workload > 50:
            return 'dynamic'
        elif workload > 20:
            return 'guided'
        else:
            return 'static'


class LoadBalancer:
    """
    Dynamic load balancer for parallel execution.
    
    Monitors thread utilization and adjusts chunk sizes dynamically.
    """

    def __init__(self, num_threads):
        self.num_threads = num_threads
        self.performance_history = []

    def estimate_chunk_size(self, total_work, avg_work_per_unit):
        """
        Estimate optimal chunk size based on workload.
        
        Args:
            total_work: Total number of iterations
            avg_work_per_unit: Estimated work per iteration
        
        Returns:
            Optimal chunk size
        """
        target_chunks_per_thread = 4

        total_units = total_work * avg_work_per_unit
        units_per_chunk = total_units / (self.num_threads * target_chunks_per_thread)

        if units_per_chunk <= 0:
            return max(1, total_work // self.num_threads)

        chunk_size = max(1, int(units_per_chunk / avg_work_per_unit))
        chunk_size = min(chunk_size, total_work)

        return chunk_size

    def should_use_dynamic_scheduling(self, iteration_work_variance):
        """
        Determine if dynamic scheduling is needed based on workload variance.
        
        Args:
            iteration_work_variance: Coefficient of variation of work per iteration
        
        Returns:
            True if dynamic scheduling is recommended
        """
        return iteration_work_variance > 0.5

    def record_performance(self, chunk_size, time_taken, num_chunks):
        """Record performance metrics for future optimization."""
        self.performance_history.append({
            'chunk_size': chunk_size,
            'time_taken': time_taken,
            'num_chunks': num_chunks,
            'throughput': num_chunks / time_taken if time_taken > 0 else 0,
        })

    def optimize_chunk_size(self, target_utilization=0.9):
        """
        Optimize chunk size based on performance history.
        
        Args:
            target_utilization: Target CPU utilization (0.0-1.0)
        
        Returns:
            Recommended chunk size adjustment factor
        """
        if not self.performance_history:
            return 1.0

        recent = self.performance_history[-5:]
        avg_throughput = sum(h['throughput'] for h in recent) / len(recent)

        if avg_throughput < target_utilization:
            return 1.5
        elif avg_throughput > target_utilization * 1.2:
            return 0.8
        else:
            return 1.0


def auto_balance_parallel(func, iterable_size, *args, **kwargs):
    """
    Automatically balance parallel execution parameters.
    
    Determines optimal:
    - Number of threads
    - Chunk size
    - Scheduling strategy
    """
    import os

    num_threads = max(1, min(os.cpu_count() or 4, iterable_size // 100))

    if iterable_size < 1000:
        schedule = 'static'
        chunk_size = max(1, iterable_size // num_threads)
    elif iterable_size < 10000:
        schedule = 'guided'
        chunk_size = max(1, iterable_size // (num_threads * 4))
    else:
        schedule = 'dynamic'
        chunk_size = max(1, iterable_size // (num_threads * 8))

    return {
        'num_threads': num_threads,
        'schedule': schedule,
        'chunk_size': chunk_size,
    }


import inspect
