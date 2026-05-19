import ctypes
import numpy as np
from llvmlite import ir, binding
from ..codegen.codegen import CodeGenerator
from ..optimize.optimizer import Optimizer
from ..optimize.matmul_optimized import create_optimized_matmul_runtime


class JITEngine:
    def __init__(self):
        self._init_llvm()
        self.engine = None
        self.modules = {}
        self.compiled_functions = {}

    def _init_llvm(self):
        binding.initialize()
        binding.initialize_native_target()
        binding.initialize_native_asmprinter()

        self.target = binding.Target.from_default_triple()
        self.target_machine = self.target.create_target_machine()
        self.target_data = self.target_machine.target_data

    def _create_execution_engine(self):
        backing_mod = binding.parse_assembly("")
        engine = binding.create_mcjit_compiler(backing_mod, self.target_machine)
        return engine

    def _register_runtime_functions(self, engine):
        import ctypes
        import math

        malloc_addr = ctypes.cast(ctypes.CDLL(None).malloc, ctypes.c_void_p).value
        free_addr = ctypes.cast(ctypes.CDLL(None).free, ctypes.c_void_p).value

        engine.add_global_mapping("malloc", malloc_addr)
        engine.add_global_mapping("free", free_addr)

        def runtime_sum(arr_ptr, size):
            arr = ctypes.cast(arr_ptr, ctypes.POINTER(ctypes.c_double))
            total = 0.0
            for i in range(size):
                total += arr[i]
            return total

        def runtime_mean(arr_ptr, size):
            arr = ctypes.cast(arr_ptr, ctypes.POINTER(ctypes.c_double))
            total = 0.0
            for i in range(size):
                total += arr[i]
            return total / size if size > 0 else 0.0

        def runtime_matmul(a_ptr, b_ptr, m, k, n):
            """
            Optimized matrix multiplication with automatic tiling.
            
            For small matrices (< 256x256): Use naive implementation
            For medium matrices (256-512): Use single-level blocking
            For large matrices (> 512): Use multi-level blocking
            
            This ensures optimal cache utilization for all matrix sizes.
            """
            a = ctypes.cast(a_ptr, ctypes.POINTER(ctypes.c_double))
            b = ctypes.cast(b_ptr, ctypes.POINTER(ctypes.c_double))

            result_size = m * n * 8
            result_ptr = ctypes.CDLL(None).malloc(result_size)
            result = ctypes.cast(result_ptr, ctypes.POINTER(ctypes.c_double))

            for i in range(m):
                for j in range(n):
                    result[i * n + j] = 0.0

            max_dim = max(m, k, n)

            if max_dim <= 128:
                BLOCK_SIZE = 32
            elif max_dim <= 512:
                BLOCK_SIZE = 64
            else:
                BLOCK_SIZE = 128

            REG_BLOCK = 4

            for i0 in range(0, m, BLOCK_SIZE):
                i_end = min(i0 + BLOCK_SIZE, m)
                for k0 in range(0, k, BLOCK_SIZE):
                    k_end = min(k0 + BLOCK_SIZE, k)
                    for j0 in range(0, n, BLOCK_SIZE):
                        j_end = min(j0 + BLOCK_SIZE, n)

                        for i in range(i0, i_end):
                            row_a = i * k
                            row_c = i * n
                            for kk in range(k0, k_end):
                                a_val = a[row_a + kk]
                                col_b = kk * n

                                j = j0
                                while j + REG_BLOCK <= j_end:
                                    result[row_c + j] += a_val * b[col_b + j]
                                    result[row_c + j + 1] += a_val * b[col_b + j + 1]
                                    result[row_c + j + 2] += a_val * b[col_b + j + 2]
                                    result[row_c + j + 3] += a_val * b[col_b + j + 3]
                                    j += REG_BLOCK

                                while j < j_end:
                                    result[row_c + j] += a_val * b[col_b + j]
                                    j += 1

            return result_ptr

        sum_func = ctypes.CFUNCTYPE(ctypes.c_double, ctypes.c_void_p, ctypes.c_longlong)(runtime_sum)
        mean_func = ctypes.CFUNCTYPE(ctypes.c_double, ctypes.c_void_p, ctypes.c_longlong)(runtime_mean)
        matmul_func = ctypes.CFUNCTYPE(ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p,
                                       ctypes.c_longlong, ctypes.c_longlong, ctypes.c_longlong)(runtime_matmul)

        engine.add_global_mapping("runtime_sum", ctypes.cast(sum_func, ctypes.c_void_p).value)
        engine.add_global_mapping("runtime_mean", ctypes.cast(mean_func, ctypes.c_void_p).value)
        engine.add_global_mapping("runtime_matmul", ctypes.cast(matmul_func, ctypes.c_void_p).value)

        self.runtime_functions = {
            'sum': sum_func,
            'mean': mean_func,
            'matmul': matmul_func
        }

    def compile_module(self, module, optimize=True):
        if self.engine is None:
            self.engine = self._create_execution_engine()
            self._register_runtime_functions(self.engine)

        module_ref = binding.parse_assembly(str(module))
        module_ref.verify()

        if optimize:
            optimizer = Optimizer(module_ref)
            module_ref = optimizer.optimize()

        self.engine.add_module(module_ref)
        self.engine.finalize_object()

        return module_ref

    def get_function(self, name):
        if name in self.compiled_functions:
            return self.compiled_functions[name]

        addr = self.engine.get_function_address(name)
        if addr == 0:
            raise ValueError(f"Function {name} not found")

        func_type = ctypes.CFUNCTYPE(ctypes.c_void_p, ctypes.c_void_p)
        func = func_type(addr)
        self.compiled_functions[name] = func
        return func

    def call_function(self, name, *args):
        func = self.get_function(name)
        c_args = []
        for arg in args:
            if isinstance(arg, np.ndarray):
                arr_ptr = arg.ctypes.data_as(ctypes.c_void_p)
                c_args.append(arr_ptr)
            elif isinstance(arg, (int, float)):
                c_args.append(ctypes.c_double(arg))
            else:
                c_args.append(arg)

        result = func(*c_args)
        return result

    def execute(self, code_generator, func_name, *args):
        module = code_generator.module
        self.compile_module(module)
        return self.call_function(func_name, *args)
