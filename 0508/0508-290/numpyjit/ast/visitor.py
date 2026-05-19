class ASTVisitor:
    def generic_visit(self, node):
        for field, value in vars(node).items():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, ASTNode):
                        item.accept(self)
            elif isinstance(value, ASTNode):
                value.accept(self)


class TypeAnalyzer(ASTVisitor):
    def __init__(self):
        self.symbol_table = {}
        self.errors = []

    def visit_FunctionDef(self, node):
        self.symbol_table[node.name.name] = {
            'type': 'function',
            'params': [p.name for p in node.params],
            'return_type': None
        }
        for stmt in node.body:
            stmt.accept(self)

    def visit_Assignment(self, node):
        node.value.accept(self)
        if hasattr(node.value, 'inferred_type'):
            self.symbol_table[node.target.name] = {
                'type': 'variable',
                'inferred_type': node.value.inferred_type
            }

    def visit_Number(self, node):
        node.inferred_type = 'float' if isinstance(node.value, float) else 'int'

    def visit_Boolean(self, node):
        node.inferred_type = 'bool'

    def visit_String(self, node):
        node.inferred_type = 'string'

    def visit_Identifier(self, node):
        if node.name in self.symbol_table:
            sym = self.symbol_table[node.name]
            if sym['type'] == 'variable':
                node.inferred_type = sym['inferred_type']

    def visit_BinOp(self, node):
        node.left.accept(self)
        node.right.accept(self)
        left_type = getattr(node.left, 'inferred_type', None)
        right_type = getattr(node.right, 'inferred_type', None)
        if left_type and right_type:
            if left_type == 'float' or right_type == 'float':
                node.inferred_type = 'float'
            else:
                node.inferred_type = left_type

    def visit_Array(self, node):
        for elem in node.elements:
            elem.accept(self)
        node.inferred_type = 'array'

    def visit_Matrix(self, node):
        for row in node.rows:
            row.accept(self)
        node.inferred_type = 'matrix'

    def visit_Sum(self, node):
        node.array.accept(self)
        node.inferred_type = 'float'

    def visit_Mean(self, node):
        node.array.accept(self)
        node.inferred_type = 'float'

    def visit_DotProduct(self, node):
        node.a.accept(self)
        node.b.accept(self)
        node.inferred_type = 'array'


from .nodes import ASTNode
