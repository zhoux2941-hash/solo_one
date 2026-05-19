class ASTNode:
    def __init__(self):
        self.type = self.__class__.__name__

    def accept(self, visitor):
        method_name = f'visit_{self.type}'
        visitor_method = getattr(visitor, method_name, visitor.generic_visit)
        return visitor_method(self)


class Program(ASTNode):
    def __init__(self, statements):
        super().__init__()
        self.statements = statements


class ExprStatement(ASTNode):
    def __init__(self, expr):
        super().__init__()
        self.expr = expr


class Assignment(ASTNode):
    def __init__(self, target, value):
        super().__init__()
        self.target = target
        self.value = value


class FunctionDef(ASTNode):
    def __init__(self, name, params, body):
        super().__init__()
        self.name = name
        self.params = params
        self.body = body


class IfStatement(ASTNode):
    def __init__(self, condition, then_body, else_body):
        super().__init__()
        self.condition = condition
        self.then_body = then_body
        self.else_body = else_body


class ForStatement(ASTNode):
    def __init__(self, var, iterable, body):
        super().__init__()
        self.var = var
        self.iterable = iterable
        self.body = body


class WhileStatement(ASTNode):
    def __init__(self, condition, body):
        super().__init__()
        self.condition = condition
        self.body = body


class ReturnStatement(ASTNode):
    def __init__(self, value):
        super().__init__()
        self.value = value


class BinOp(ASTNode):
    def __init__(self, left, op, right):
        super().__init__()
        self.left = left
        self.op = op
        self.right = right


class UnaryOp(ASTNode):
    def __init__(self, op, operand):
        super().__init__()
        self.op = op
        self.operand = operand


class Number(ASTNode):
    def __init__(self, value):
        super().__init__()
        self.value = value


class Identifier(ASTNode):
    def __init__(self, name):
        super().__init__()
        self.name = name


class String(ASTNode):
    def __init__(self, value):
        super().__init__()
        self.value = value


class Boolean(ASTNode):
    def __init__(self, value):
        super().__init__()
        self.value = value


class NoneValue(ASTNode):
    def __init__(self):
        super().__init__()


class Subscript(ASTNode):
    def __init__(self, value, index):
        super().__init__()
        self.value = value
        self.index = index


class Call(ASTNode):
    def __init__(self, func, args):
        super().__init__()
        self.func = func
        self.args = args


class Array(ASTNode):
    def __init__(self, elements):
        super().__init__()
        self.elements = elements


class Matrix(ASTNode):
    def __init__(self, rows):
        super().__init__()
        self.rows = rows


class Sum(ASTNode):
    def __init__(self, array, axis):
        super().__init__()
        self.array = array
        self.axis = axis


class Mean(ASTNode):
    def __init__(self, array, axis):
        super().__init__()
        self.array = array
        self.axis = axis


class DotProduct(ASTNode):
    def __init__(self, a, b):
        super().__init__()
        self.a = a
        self.b = b
