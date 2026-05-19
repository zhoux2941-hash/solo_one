import sys
sys.path.insert(0, '.')

print("Testing imports...")

try:
    from numpyjit.lexer.lexer import Lexer
    print("✓ Lexer imported successfully")
except Exception as e:
    print(f"✗ Lexer failed: {e}")

try:
    from numpyjit.parser.parser import Parser
    print("✓ Parser imported successfully")
except Exception as e:
    print(f"✗ Parser failed: {e}")

try:
    from numpyjit.ast.nodes import Program, BinOp, Number
    print("✓ AST nodes imported successfully")
except Exception as e:
    print(f"✗ AST nodes failed: {e}")

try:
    from numpyjit.codegen.codegen import CodeGenerator
    print("✓ CodeGenerator imported successfully")
except Exception as e:
    print(f"✗ CodeGenerator failed: {e}")

try:
    from numpyjit.optimize.optimizer import Optimizer
    print("✓ Optimizer imported successfully")
except Exception as e:
    print(f"✗ Optimizer failed: {e}")

try:
    from numpyjit.jit.engine import JITEngine
    print("✓ JITEngine imported successfully")
except Exception as e:
    print(f"✗ JITEngine failed: {e}")

try:
    from numpyjit.jit.decorator import jit
    print("✓ @jit decorator imported successfully")
except Exception as e:
    print(f"✗ @jit decorator failed: {e}")

print("\nImport test completed!")
