from llvmlite import ir, binding
from ..ast.visitor import ASTVisitor


class CodeGenerator(ASTVisitor):
    def __init__(self, module_name="jit_module"):
        self.module = ir.Module(name=module_name)
        self.builder = None
        self.symbol_table = {}
        self.function_signatures = {}
        self.current_function = None

        self.float_type = ir.FloatType()
        self.double_type = ir.DoubleType()
        self.int32_type = ir.IntType(32)
        self.int64_type = ir.IntType(64)
        self.bool_type = ir.IntType(1)
        self.void_type = ir.VoidType()

        self._init_runtime_functions()

    def _init_runtime_functions(self):
        array_ptr_type = ir.PointerType(self.double_type)
        int_ptr_type = ir.PointerType(self.int64_type)

        malloc_type = ir.FunctionType(ir.PointerType(ir.IntType(8)), [self.int64_type])
        self.malloc_func = ir.Function(self.module, malloc_type, name="malloc")

        free_type = ir.FunctionType(self.void_type, [ir.PointerType(ir.IntType(8))])
        self.free_func = ir.Function(self.module, free_type, name="free")

        sum_func_type = ir.FunctionType(self.double_type, [array_ptr_type, self.int64_type])
        self.sum_func = ir.Function(self.module, sum_func_type, name="runtime_sum")

        mean_func_type = ir.FunctionType(self.double_type, [array_ptr_type, self.int64_type])
        self.mean_func = ir.Function(self.module, mean_func_type, name="runtime_mean")

        matmul_func_type = ir.FunctionType(array_ptr_type, [
            array_ptr_type, array_ptr_type,
            self.int64_type, self.int64_type, self.int64_type
        ])
        self.matmul_func = ir.Function(self.module, matmul_func_type, name="runtime_matmul")

    def generic_visit(self, node):
        raise NotImplementedError(f"Visit method not implemented for {type(node).__name__}")

    def visit_Program(self, node):
        for stmt in node.statements:
            stmt.accept(self)

    def visit_FunctionDef(self, node):
        func_name = node.name.name
        param_types = [self.double_type.as_pointer() for _ in node.params]
        func_type = ir.FunctionType(self.double_type.as_pointer(), param_types)
        func = ir.Function(self.module, func_type, name=func_name)
        self.function_signatures[func_name] = func

        entry_block = func.append_basic_block(name="entry")
        self.builder = ir.IRBuilder(entry_block)
        self.current_function = func

        self.symbol_table = {}
        for i, param in enumerate(node.params):
            self.symbol_table[param.name] = func.args[i]

        for stmt in node.body:
            stmt.accept(self)

        self.builder.ret(ir.Constant(self.double_type, 0.0).bitcast(self.double_type.as_pointer()))

    def visit_Assignment(self, node):
        value = node.value.accept(self)
        if isinstance(node.target, list):
            for i, target in enumerate(node.target):
                self.symbol_table[target.name] = self.builder.extract_value(value, i)
        else:
            self.symbol_table[node.target.name] = value

    def visit_ReturnStatement(self, node):
        if node.value:
            ret_val = node.value.accept(self)
            self.builder.ret(ret_val)
        else:
            self.builder.ret_void()

    def visit_BinOp(self, node):
        left = node.left.accept(self)
        right = node.right.accept(self)

        op = node.op
        if op == '+':
            return self.builder.fadd(left, right, name="addtmp")
        elif op == '-':
            return self.builder.fsub(left, right, name="subtmp")
        elif op == '*':
            return self.builder.fmul(left, right, name="multmp")
        elif op == '/':
            return self.builder.fdiv(left, right, name="divtmp")
        elif op == '**':
            pow_func = self.module.globals.get("llvm.pow.f64")
            if not pow_func:
                pow_func_type = ir.FunctionType(self.double_type, [self.double_type, self.double_type])
                pow_func = ir.Function(self.module, pow_func_type, name="llvm.pow.f64")
            return self.builder.call(pow_func, [left, right], name="powtmp")
        elif op == '==':
            return self.builder.fcmp_ordered('==', left, right, name="eqtmp")
        elif op == '!=':
            return self.builder.fcmp_ordered('!=', left, right, name="netmp")
        elif op == '<':
            return self.builder.fcmp_ordered('<', left, right, name="lttmp")
        elif op == '>':
            return self.builder.fcmp_ordered('>', left, right, name="gttmp")
        elif op == '<=':
            return self.builder.fcmp_ordered('<=', left, right, name="letmp")
        elif op == '>=':
            return self.builder.fcmp_ordered('>=', left, right, name="getmp")
        else:
            raise ValueError(f"Unknown binary operator: {op}")

    def visit_UnaryOp(self, node):
        operand = node.operand.accept(self)
        op = node.op
        if op == '-':
            return self.builder.fneg(operand, name="negtmp")
        elif op == 'not':
            return self.builder.not_(operand, name="nottmp")
        else:
            raise ValueError(f"Unknown unary operator: {op}")

    def visit_Number(self, node):
        if isinstance(node.value, int):
            return ir.Constant(self.int64_type, node.value)
        else:
            return ir.Constant(self.double_type, node.value)

    def visit_Identifier(self, node):
        if node.name in self.symbol_table:
            return self.symbol_table[node.name]
        else:
            raise ValueError(f"Undefined variable: {node.name}")

    def visit_Boolean(self, node):
        return ir.Constant(self.bool_type, 1 if node.value else 0)

    def visit_Array(self, node):
        elements = [elem.accept(self) for elem in node.elements]
        n = len(elements)

        size = self.int64_type(n * 8)
        ptr = self.builder.call(self.malloc_func, [size], name="array_ptr")
        array_ptr = self.builder.bitcast(ptr, self.double_type.as_pointer())

        for i, elem in enumerate(elements):
            idx = ir.Constant(self.int64_type, i)
            elem_ptr = self.builder.gep(array_ptr, [idx], inbounds=True)
            self.builder.store(elem, elem_ptr)

        return array_ptr

    def visit_Sum(self, node):
        array = node.array.accept(self)
        size = self._get_array_size(node.array)
        return self.builder.call(self.sum_func, [array, ir.Constant(self.int64_type, size)])

    def visit_Mean(self, node):
        array = node.array.accept(self)
        size = self._get_array_size(node.array)
        return self.builder.call(self.mean_func, [array, ir.Constant(self.int64_type, size)])

    def visit_DotProduct(self, node):
        a = node.a.accept(self)
        b = node.b.accept(self)
        m = self._get_array_size(node.a)
        k = self._get_array_size(node.b)
        n = 1
        return self.builder.call(self.matmul_func, [a, b,
            ir.Constant(self.int64_type, m),
            ir.Constant(self.int64_type, k),
            ir.Constant(self.int64_type, n)])

    def visit_Call(self, node):
        func_name = node.func.name
        if func_name in self.function_signatures:
            func = self.function_signatures[func_name]
            args = [arg.accept(self) for arg in node.args]
            return self.builder.call(func, args)
        else:
            raise ValueError(f"Undefined function: {func_name}")

    def visit_ExprStatement(self, node):
        node.expr.accept(self)

    def visit_IfStatement(self, node):
        cond = node.condition.accept(self)

        then_block = self.builder.append_basic_block(name="then")
        else_block = self.builder.append_basic_block(name="else")
        merge_block = self.builder.append_basic_block(name="ifcont")

        self.builder.cbranch(cond, then_block, else_block)

        self.builder.position_at_start(then_block)
        for stmt in node.then_body:
            stmt.accept(self)
        self.builder.branch(merge_block)

        self.builder.position_at_start(else_block)
        for stmt in node.else_body:
            stmt.accept(self)
        self.builder.branch(merge_block)

        self.builder.position_at_start(merge_block)

    def visit_ForStatement(self, node):
        start_block = self.builder.append_basic_block(name="for_start")
        loop_block = self.builder.append_basic_block(name="for_loop")
        end_block = self.builder.append_basic_block(name="for_end")

        iterable = node.iterable.accept(self)
        self.builder.branch(start_block)

        self.builder.position_at_start(start_block)
        idx = self.builder.phi(self.int64_type, name="loop_idx")
        idx.add_incoming(ir.Constant(self.int64_type, 0), self.builder.block)

        self.symbol_table[node.var.name] = idx

        size = self._get_array_size(node.iterable)
        cond = self.builder.icmp_signed('<', idx, ir.Constant(self.int64_type, size))
        self.builder.cbranch(cond, loop_block, end_block)

        self.builder.position_at_start(loop_block)
        for stmt in node.body:
            stmt.accept(self)

        next_idx = self.builder.add(idx, ir.Constant(self.int64_type, 1))
        idx.add_incoming(next_idx, self.builder.block)
        self.builder.branch(start_block)

        self.builder.position_at_start(end_block)

    def visit_WhileStatement(self, node):
        cond_block = self.builder.append_basic_block(name="while_cond")
        loop_block = self.builder.append_basic_block(name="while_loop")
        end_block = self.builder.append_basic_block(name="while_end")

        self.builder.branch(cond_block)

        self.builder.position_at_start(cond_block)
        cond = node.condition.accept(self)
        self.builder.cbranch(cond, loop_block, end_block)

        self.builder.position_at_start(loop_block)
        for stmt in node.body:
            stmt.accept(self)
        self.builder.branch(cond_block)

        self.builder.position_at_start(end_block)

    def _get_array_size(self, node):
        if hasattr(node, 'elements'):
            return len(node.elements)
        elif hasattr(node, 'rows'):
            return len(node.rows)
        return 10

    def generate_ir(self):
        return str(self.module)
