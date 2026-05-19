import ply.yacc as yacc
from ..lexer.lexer import Lexer
from ..ast.nodes import *


class Parser:
    tokens = Lexer.tokens

    precedence = (
        ('left', 'OR'),
        ('left', 'AND'),
        ('left', 'NOT'),
        ('left', 'EQ', 'NE', 'LT', 'GT', 'LE', 'GE'),
        ('left', 'PLUS', 'MINUS'),
        ('left', 'MULTIPLY', 'DIVIDE', 'MODULO'),
        ('right', 'POWER'),
        ('right', 'UMINUS'),
    )

    def p_program(self, p):
        '''program : statements'''
        p[0] = Program(p[1])

    def p_statements(self, p):
        '''statements : statement
                      | statements statement'''
        if len(p) == 2:
            p[0] = [p[1]]
        else:
            p[0] = p[1] + [p[2]]

    def p_statement(self, p):
        '''statement : expr_statement
                     | assignment
                     | function_def
                     | if_statement
                     | for_statement
                     | while_statement
                     | return_statement'''
        p[0] = p[1]

    def p_expr_statement(self, p):
        '''expr_statement : expression NEWLINE
                          | expression'''
        p[0] = ExprStatement(p[1])

    def p_assignment(self, p):
        '''assignment : IDENTIFIER ASSIGN expression NEWLINE
                      | IDENTIFIER ASSIGN expression'''
        p[0] = Assignment(Identifier(p[1]), p[3])

    def p_function_def(self, p):
        '''function_def : DEF IDENTIFIER LPAREN parameters RPAREN COLON NEWLINE suite'''
        p[0] = FunctionDef(p[2], p[4], p[8])

    def p_parameters(self, p):
        '''parameters :
                      | parameter_list'''
        p[0] = p[1] if len(p) > 1 else []

    def p_parameter_list(self, p):
        '''parameter_list : IDENTIFIER
                          | parameter_list COMMA IDENTIFIER'''
        if len(p) == 2:
            p[0] = [Identifier(p[1])]
        else:
            p[0] = p[1] + [Identifier(p[3])]

    def p_suite(self, p):
        '''suite : statement
                 | LBRACE statements RBRACE'''
        if len(p) == 2:
            p[0] = [p[1]]
        else:
            p[0] = p[2]

    def p_if_statement(self, p):
        '''if_statement : IF expression COLON NEWLINE suite else_clause'''
        p[0] = IfStatement(p[2], p[5], p[6])

    def p_else_clause(self, p):
        '''else_clause :
                       | ELSE COLON NEWLINE suite'''
        p[0] = p[4] if len(p) > 1 else []

    def p_for_statement(self, p):
        '''for_statement : FOR IDENTIFIER IN expression COLON NEWLINE suite'''
        p[0] = ForStatement(Identifier(p[2]), p[4], p[7])

    def p_while_statement(self, p):
        '''while_statement : WHILE expression COLON NEWLINE suite'''
        p[0] = WhileStatement(p[2], p[5])

    def p_return_statement(self, p):
        '''return_statement : RETURN expression NEWLINE
                            | RETURN expression
                            | RETURN NEWLINE
                            | RETURN'''
        p[0] = ReturnStatement(p[2] if len(p) > 2 else None)

    def p_expression_binop(self, p):
        '''expression : expression PLUS expression
                      | expression MINUS expression
                      | expression MULTIPLY expression
                      | expression DIVIDE expression
                      | expression MODULO expression
                      | expression POWER expression
                      | expression AND expression
                      | expression OR expression
                      | expression EQ expression
                      | expression NE expression
                      | expression LT expression
                      | expression GT expression
                      | expression LE expression
                      | expression GE expression'''
        p[0] = BinOp(p[1], p[2], p[3])

    def p_expression_unary(self, p):
        '''expression : MINUS expression %prec UMINUS
                      | NOT expression'''
        p[0] = UnaryOp(p[1], p[2])

    def p_expression_group(self, p):
        '''expression : LPAREN expression RPAREN'''
        p[0] = p[2]

    def p_expression_number(self, p):
        '''expression : NUMBER'''
        p[0] = Number(p[1])

    def p_expression_identifier(self, p):
        '''expression : IDENTIFIER'''
        p[0] = Identifier(p[1])

    def p_expression_string(self, p):
        '''expression : STRING'''
        p[0] = String(p[1])

    def p_expression_bool(self, p):
        '''expression : TRUE
                      | FALSE'''
        p[0] = Boolean(p[1] == 'True')

    def p_expression_none(self, p):
        '''expression : NONE'''
        p[0] = NoneValue()

    def p_expression_subscript(self, p):
        '''expression : expression LBRACKET expression RBRACKET'''
        p[0] = Subscript(p[1], p[3])

    def p_expression_call(self, p):
        '''expression : expression LPAREN arguments RPAREN'''
        p[0] = Call(p[1], p[3])

    def p_arguments(self, p):
        '''arguments :
                     | argument_list'''
        p[0] = p[1] if len(p) > 1 else []

    def p_argument_list(self, p):
        '''argument_list : expression
                         | argument_list COMMA expression'''
        if len(p) == 2:
            p[0] = [p[1]]
        else:
            p[0] = p[1] + [p[3]]

    def p_expression_array(self, p):
        '''expression : ARRAY LPAREN arguments RPAREN'''
        p[0] = Array(p[3])

    def p_expression_matrix(self, p):
        '''expression : MATRIX LPAREN arguments RPAREN'''
        p[0] = Matrix(p[3])

    def p_expression_sum(self, p):
        '''expression : SUM LPAREN expression RPAREN
                      | SUM LPAREN expression COMMA expression RPAREN'''
        if len(p) == 5:
            p[0] = Sum(p[3], None)
        else:
            p[0] = Sum(p[3], p[5])

    def p_expression_mean(self, p):
        '''expression : MEAN LPAREN expression RPAREN
                       | MEAN LPAREN expression COMMA expression RPAREN'''
        if len(p) == 5:
            p[0] = Mean(p[3], None)
        else:
            p[0] = Mean(p[3], p[5])

    def p_expression_dot(self, p):
        '''expression : DOT_PRODUCT LPAREN expression COMMA expression RPAREN'''
        p[0] = DotProduct(p[3], p[5])

    def p_error(self, p):
        if p:
            print(f"Syntax error at '{p.value}', line {p.lineno}")
        else:
            print("Syntax error at EOF")

    def __init__(self):
        self.lexer = Lexer()
        self.parser = yacc.yacc(module=self, debug=False)

    def parse(self, code):
        return self.parser.parse(code, lexer=self.lexer.lexer)
