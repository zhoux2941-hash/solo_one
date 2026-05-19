import ply.lex as lex


class Lexer:
    tokens = [
        'NUMBER', 'STRING', 'IDENTIFIER',
        'PLUS', 'MINUS', 'MULTIPLY', 'DIVIDE', 'POWER', 'MODULO',
        'LPAREN', 'RPAREN', 'LBRACKET', 'RBRACKET', 'LBRACE', 'RBRACE',
        'COMMA', 'DOT', 'COLON', 'SEMICOLON', 'ASSIGN',
        'EQ', 'NE', 'LT', 'GT', 'LE', 'GE',
        'AND', 'OR', 'NOT',
        'IF', 'ELSE', 'FOR', 'IN', 'WHILE', 'RETURN', 'DEF',
        'TRUE', 'FALSE', 'NONE',
        'ARRAY', 'MATRIX', 'SUM', 'MEAN', 'DOT_PRODUCT',
        'NEWLINE', 'INDENT', 'DEDENT'
    ]

    t_PLUS = r'\+'
    t_MINUS = r'-'
    t_MULTIPLY = r'\*'
    t_DIVIDE = r'/'
    t_POWER = r'\*\*'
    t_MODULO = r'%'
    t_LPAREN = r'\('
    t_RPAREN = r'\)'
    t_LBRACKET = r'\['
    t_RBRACKET = r'\]'
    t_LBRACE = r'\{'
    t_RBRACE = r'\}'
    t_COMMA = r','
    t_DOT = r'\.'
    t_COLON = r':'
    t_SEMICOLON = r';'
    t_ASSIGN = r'='
    t_EQ = r'=='
    t_NE = r'!='
    t_LT = r'<'
    t_GT = r'>'
    t_LE = r'<='
    t_GE = r'>='

    reserved = {
        'and': 'AND',
        'or': 'OR',
        'not': 'NOT',
        'if': 'IF',
        'else': 'ELSE',
        'for': 'FOR',
        'in': 'IN',
        'while': 'WHILE',
        'return': 'RETURN',
        'def': 'DEF',
        'True': 'TRUE',
        'False': 'FALSE',
        'None': 'NONE',
        'array': 'ARRAY',
        'matrix': 'MATRIX',
        'sum': 'SUM',
        'mean': 'MEAN',
        'dot': 'DOT_PRODUCT',
    }

    def t_IDENTIFIER(self, t):
        r'[a-zA-Z_][a-zA-Z0-9_]*'
        t.type = self.reserved.get(t.value, 'IDENTIFIER')
        return t

    def t_NUMBER(self, t):
        r'\d+(\.\d*)?([eE][+-]?\d+)?'
        if '.' in t.value or 'e' in t.value.lower():
            t.value = float(t.value)
        else:
            t.value = int(t.value)
        return t

    def t_STRING(self, t):
        r'"[^"]*"|\'[^\']*\''
        t.value = t.value[1:-1]
        return t

    def t_NEWLINE(self, t):
        r'\n+'
        t.lexer.lineno += len(t.value)
        return t

    t_ignore_COMMENT = r'\#.*'

    t_ignore = ' \t'

    def t_error(self, t):
        print(f"Illegal character '{t.value[0]}' at line {t.lineno}")
        t.lexer.skip(1)

    def __init__(self):
        self.lexer = lex.lex(module=self)
        self.indent_stack = [0]
        self.pending_tokens = []

    def token(self):
        if self.pending_tokens:
            return self.pending_tokens.pop(0)

        tok = self.lexer.token()

        if tok and tok.type == 'NEWLINE':
            next_tok = self.lexer.token()
            if next_tok and next_tok.type == 'INDENT':
                return self._handle_indent(next_tok)
            return tok

        return tok

    def input(self, data):
        self.lexer.input(data)
        self.indent_stack = [0]
        self.pending_tokens = []
