import unittest
import numpy as np
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from numpyjit.parser.parser import Parser
from numpyjit.codegen.codegen import CodeGenerator
from numpyjit.jit.engine import JITEngine
from numpyjit import jit, array


class TestLexer(unittest.TestCase):
    def test_numbers(self):
        parser = Parser()
        ast = parser.parse("x = 42.5")
        self.assertIsNotNone(ast)

    def test_operators(self):
        parser = Parser()
        ast = parser.parse("x = 1 + 2 * 3")
        self.assertIsNotNone(ast)


class TestCodeGen(unittest.TestCase):
    def test_simple_function(self):
        parser = Parser()
        code = """
def test(a, b): {
    return a + b
}
"""
        ast = parser.parse(code)
        codegen = CodeGenerator("test_module")
        ast.accept(codegen)
        ir_code = codegen.generate_ir()
        self.assertIn("define", ir_code)


class TestJITEngine(unittest.TestCase):
    def test_engine_init(self):
        engine = JITEngine()
        self.assertIsNotNone(engine)


class TestArrayOperations(unittest.TestCase):
    def test_array_creation(self):
        arr = array([1, 2, 3, 4, 5])
        self.assertEqual(len(arr), 5)
        self.assertEqual(arr[0], 1.0)


if __name__ == '__main__':
    unittest.main()
