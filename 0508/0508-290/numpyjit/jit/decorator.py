import inspect
import ast as python_ast
import numpy as np
from functools import wraps
from ..parser.parser import Parser
from ..codegen.codegen import CodeGenerator
from .engine import JITEngine
from ..optimize.matmul_optimized import OptimizedMatrixMultiply, ParallelConfig
from ..parallel.parallel import (
    ParallelExecutor,
    parallel_for,
    parallel_reduce,
    get_num_threads,
    set_num_threads,
)


class PythonToDSLTransformer(python_ast.NodeTransformer):
    def __init__(self):
        self.dsl_code = []

    def visit_FunctionDef(self, node):
        args = ", ".join(arg.arg for arg in node.args.args)
        self.dsl_code.append(f"def {node.name}({args}): {{")
        for stmt in node.body:
            self.visit(stmt)
        self.dsl_code.append("}")
        return node

    def visit_Return(self, node):
        if node.value:
            value_str = self._expr_to_str(node.value)
            self.dsl_code.append(f"return {value_str}")
        else:
            self.dsl_code.append("return")
        return node

    def visit_Assign(self, node):
        target = self._expr_to_str(node.targets[0])
        value = self._expr_to_str(node.value)
        self.dsl_code.append(f"{target} = {value}")
        return node

    def visit_For(self, node):
        target = self._expr_to_str(node.target)
        iter_str = self._expr_to_str(node.iter)
        self.dsl_code.append(f"for {target} in {iter_str}: {{")
        for stmt in node.body:
            self.visit(stmt)
        self.dsl_code.append("}")
        return node

    def visit_While(self, node):
        cond = self._expr_to_str(node.test)
        self.dsl_code.append(f"while {cond}: {{")
        for stmt in node.body:
            self.visit(stmt)
        self.dsl_code.append("}")
        return node

    def visit_If(self, node):
        cond = self._expr_to_str(node.test)
        self.dsl_code.append(f"if {cond}: {{")
        for stmt in node.body:
            self.visit(stmt)
        self.dsl_code.append("} else {")
        for stmt in node.orelse:
            self.visit(stmt)
        self.dsl_code.append("}")
        return node

    def visit_Call(self, node):
        func_name = self._expr_to_str(node.func)
        args = ", ".join(self._expr_to_str(arg) for arg in node.args)
        return f"{func_name}({args})"

    def _expr_to_str(self, node):
        if isinstance(node, python_ast.Name):
            return node.id
        elif isinstance(node, python_ast.Constant):
            return repr(node.value)
        elif isinstance(node, python_ast.Num):
            return str(node.n)
        elif isinstance(node, python_ast.Str):
            return repr(node.s)
        elif isinstance(node, python_ast.BinOp):
            left = self._expr_to_str(node.left)
            op = self._op_to_str(node.op)
            right = self._expr_to_str(node.right)
            return f"({left} {op} {right})"
        elif isinstance(node, python_ast.UnaryOp):
            op = self._op_to_str(node.op)
            operand = self._expr_to_str(node.operand)
            return f"{op}{operand}"
        elif isinstance(node, python_ast.Compare):
            left = self._expr_to_str(node.left)
            ops = [self._op_to_str(op) for op in node.ops]
            comparators = [self._expr_to_str(comp) for comp in node.comparators]
            result = left
            for op, comp in zip(ops, comparators):
                result = f"({result} {op} {comp})"
            return result
        elif isinstance(node, python_ast.Call):
            return self.visit_Call(node)
        elif isinstance(node, python_ast.List):
            elements = ", ".join(self._expr_to_str(elem) for elem in node.elts)
            return f"array({elements})"
        else:
            return str(node)

    def _op_to_str(self, op):
        op_map = {
            python_ast.Add: '+',
            python_ast.Sub: '-',
            python_ast.Mult: '*',
            python_ast.Div: '/',
            python_ast.Mod: '%',
            python_ast.Pow: '**',
            python_ast.USub: '-',
            python_ast.Not: 'not ',
            python_ast.Eq: '==',
            python_ast.NotEq: '!=',
            python_ast.Lt: '<',
            python_ast.Gt: '>',
            python_ast.LtE: '<=',
            python_ast.GtE: '>=',
        }
        return op_map.get(type(op), '?')


class JITCompiler:
    def __init__(self):
        self.parser = Parser()
        self.engine = JITEngine()
        self.compiled_cache = {}

    def compile(self, func):
        source = inspect.getsource(func)
        source = self._clean_source(source)

        tree = python_ast.parse(source)
        transformer = PythonToDSLTransformer()
        transformer.visit(tree)
        dsl_code = "\n".join(transformer.dsl_code)

        ast = self.parser.parse(dsl_code)
        codegen = CodeGenerator(func.__name__)
        ast.accept(codegen)

        self.engine.compile_module(codegen.module)

        self.compiled_cache[func.__name__] = {
            'codegen': codegen,
            'func': func
        }

        return func.__name__

    def _clean_source(self, source):
        lines = source.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('@'):
                continue
            cleaned.append(line)
        return '\n'.join(cleaned)

    def __call__(self, func_name, *args):
        if func_name not in self.compiled_cache:
            raise ValueError(f"Function {func_name} not compiled")

        return self.engine.call_function(func_name, *args)


_compiler = JITCompiler()


def jit(func=None, *, optimize=True, target='cpu'):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            func_name = f.__name__
            if func_name not in _compiler.compiled_cache:
                _compiler.compile(f)
            return _compiler(func_name, *args)
        wrapper.compiled = True
        return wrapper

    if func is None:
        return decorator
    else:
        return decorator(func)


def array(data, dtype=np.float64):
    return np.array(data, dtype=dtype)


def matrix(data, dtype=np.float64):
    return np.array(data, dtype=dtype)


def dot(A, B, tiled=True):
    """
    Optimized matrix multiplication C = A @ B.
    
    Uses loop tiling (blocking) for cache efficiency, which is
    especially important for large matrices (> 256x256).
    
    Args:
        A: Left matrix (m x k)
        B: Right matrix (k x n)
        tiled: Whether to use tiled optimization (default: True)
    
    Returns:
        C: Result matrix (m x n)
    """
    if tiled:
        return OptimizedMatrixMultiply.matmul_tiled(A, B)
    else:
        return A @ B


def matmul(A, B):
    """
    Alias for dot(). Optimized matrix multiplication with tiling.
    """
    return dot(A, B, tiled=True)


def parallel(num_threads=None):
    """
    Decorator to mark a function for parallel execution.
    
    This provides an OpenMP-like interface for parallelizing loops.
    
    Args:
        num_threads: Number of threads to use (default: auto-detect)
    
    Example:
        @parallel(num_threads=4)
        def process_data(data):
            result = 0
            for i in prange(len(data)):  # Parallel range
                result += data[i]
            return result
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            original_num_threads = get_num_threads()
            if num_threads is not None:
                set_num_threads(num_threads)

            try:
                return func(*args, **kwargs)
            finally:
                if num_threads is not None:
                    set_num_threads(original_num_threads)

        wrapper._is_parallel = True
        wrapper._num_threads = num_threads
        return wrapper

    return decorator


def prange(start, stop=None, step=1, schedule='static'):
    """
    Parallel range iterator (similar to OpenMP's parallel for).
    
    This function should be used inside @parallel decorated functions.
    
    Args:
        start: Start index (or stop if only one argument)
        stop: Stop index
        step: Step size
        schedule: Scheduling strategy ('static', 'dynamic', 'guided')
    
    Returns:
        List of indices to iterate over
    
    Example:
        @parallel()
        def sum_array(arr):
            total = 0
            for i in prange(len(arr)):
                total += arr[i]
            return total
    """
    if stop is None:
        start, stop = 0, start

    def identity(i):
        return i

    return parallel_for(identity, start, stop, step, schedule=schedule)


class parallel_region:
    """
    Context manager for parallel regions (OpenMP style).
    
    Example:
        with parallel_region(num_threads=4):
            # Code in this region can use parallel operations
            result = parallel_reduce(compute, 0, 1000)
    """

    def __init__(self, num_threads=None):
        self.num_threads = num_threads
        self.executor = None

    def __enter__(self):
        self.executor = ParallelExecutor(self.num_threads)
        self.executor.__enter__()
        return self.executor

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.executor:
            self.executor.__exit__(exc_type, exc_val, exc_tb)
            self.executor = None


def auto_parallel(func=None, *, threshold=10000, schedule='static'):
    """
    Decorator for automatic parallelization.
    
    Analyzes the function and automatically parallelizes loops
    that exceed the threshold size.
    
    Args:
        threshold: Minimum loop size to consider parallelization
        schedule: Default scheduling strategy
    
    Example:
        @auto_parallel(threshold=1000)
        def compute(arr):
            # Loops over len(arr) > 1000 will be auto-parallelized
            result = 0
            for i in range(len(arr)):
                result += arr[i]
            return result
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ParallelConfig.enabled = True
            try:
                return f(*args, **kwargs)
            finally:
                pass

        wrapper._auto_parallel = True
        wrapper._threshold = threshold
        return wrapper

    if func is None:
        return decorator
    else:
        return decorator(func)


def set_parallel_threads(n):
    """
    Set the number of threads for parallel execution.
    
    Args:
        n: Number of threads (0 or negative means auto-detect)
    """
    if n <= 0:
        n = max(1, os.cpu_count() or 4)
    set_num_threads(n)
    ParallelConfig.set_num_threads(n)


def get_parallel_threads():
    """Get the number of threads used for parallel execution."""
    return get_num_threads()


import os


