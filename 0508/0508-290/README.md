# NumPyJIT: JIT Compiler for NumPy-like DSL

A Just-In-Time (JIT) compiler that compiles a custom Python DSL (Domain-Specific Language) with NumPy-like array operations into native machine code using LLVM.

## Features

### Frontend
- **PLY-based Lexer & Parser**: Parses Python-like DSL syntax
- **Abstract Syntax Tree (AST)**: Represents parsed code structure
- **Type Analysis**: Inference of types for variables and expressions

### Middle-end (Optimization)
- **Dead Code Elimination (DCE)**: Removes unused instructions
- **Loop Unrolling**: Unrolls loops to improve instruction-level parallelism
- **Vectorization (SIMD)**: Single Instruction Multiple Data optimization
- **Instruction Combining**: Combines redundant operations
- **Constant Propagation**: Propagates constant values
- **Loop Tiling (Blocking)**: Cache optimization for nested loops
- **Automatic Parallelization**: Multi-threading for large workloads

### Backend
- **LLVM IR Generation**: Generates LLVM Intermediate Representation
- **LLVM MCJIT Engine**: Just-In-Time compilation to native code
- **Runtime Functions**: Pre-compiled support for array operations
- **Thread Pool**: Parallel execution with configurable thread count

### Parallel Execution
- **@parallel Decorator**: Mark functions for multi-threaded execution
- **prange**: Parallel range iterator (OpenMP-style)
- **parallel_region**: Context manager for explicit parallel regions
- **Auto-parallel Matrix Multiply**: Automatic multi-threading for dot/matmul
- **Load Balancer**: Dynamic scheduling for uneven workloads
- **Scheduling Strategies**: Static, Dynamic, Guided

### User API
- **@jit Decorator**: Automatically compiles decorated functions
- **@parallel Decorator**: Marks functions for parallel execution
- **array / matrix**: Array creation utilities
- **sum / mean**: Reduce operations (serial and parallel)
- **dot / matmul**: Matrix multiplication (auto-parallel)
- **set_parallel_threads**: Configure number of threads

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Code (@jit)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Python AST to DSL Transformer              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                PLY Lexer & Parser                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      AST Nodes                          │
│          (Program, FunctionDef, BinOp, etc.)            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               LLVM IR Code Generator                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                Optimization Passes                      │
│  (DCE, Loop Unrolling, Vectorization, etc.)             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 LLVM MCJIT Engine                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Native Machine Code                   │
└─────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Python 3.9+
- LLVM (via llvmlite)
- NumPy

### Setup

```bash
pip install -r requirements.txt
pip install -e .
```

## Usage

### Basic Example

```python
from numpyjit import jit, array
import numpy as np

@jit
def scalar_operation(a, b):
    c = a + b
    d = a * b
    return c - d

# Call the compiled function
result = scalar_operation(3.14, 2.718)
print(result)
```

### Array Operations

```python
@jit
def array_sum(arr):
    return sum(arr)

arr = array([1.0, 2.0, 3.0, 4.0, 5.0])
result = array_sum(arr)
```

### Matrix Multiplication

```python
@jit
def matmul_example(A, B):
    return dot(A, B)

A = np.random.rand(256, 256)
B = np.random.rand(256, 256)
C = matmul_example(A, B)
```

## Running Tests

```bash
# Run unit tests
python -m pytest tests/ -v

# Run benchmarks
python benchmarks/benchmark.py

# Run usage example
python examples/usage_example.py
```

## Performance Target

- **Goal**: Achieve 80% of hand-written C performance
- **Baseline**: NumPy (highly optimized C/Fortran)
- **Key Optimizations**:
  - Loop unrolling (factor 4 by default)
  - SIMD vectorization
  - Dead code elimination
  - Constant propagation
  - Instruction-level parallelism

## Project Structure

```
numpyjit/
├── __init__.py                 # Main module exports
├── lexer/                      # Lexical analysis
│   ├── __init__.py
│   └── lexer.py                # PLY-based lexer
├── parser/                     # Syntactic analysis
│   ├── __init__.py
│   └── parser.py               # PLY-based parser
├── ast/                        # Abstract Syntax Tree
│   ├── __init__.py
│   ├── nodes.py                # AST node definitions
│   └── visitor.py              # AST visitor pattern
├── codegen/                    # Code generation
│   ├── __init__.py
│   └── codegen.py              # LLVM IR generator
├── optimize/                   # Optimization passes
│   ├── __init__.py
│   └── optimizer.py            # Optimization manager
└── jit/                        # JIT execution
    ├── __init__.py
    ├── engine.py               # LLVM MCJIT engine
    └── decorator.py            # @jit decorator

tests/                          # Unit tests
benchmarks/                     # Performance benchmarks
examples/                       # Usage examples
```

## Implementation Details

### Supported Operations

#### Scalar Operations
- Arithmetic: `+`, `-`, `*`, `/`, `**`, `%`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `and`, `or`, `not`
- Unary: `-` (negation)

#### Array Operations
- `array([...])`: Create 1D array
- `matrix([[...]])`: Create 2D matrix
- `sum(arr, axis=None)`: Sum reduction
- `mean(arr, axis=None)`: Mean reduction
- `dot(A, B)`: Matrix multiplication

#### Control Flow
- `if` / `else` statements
- `for` loops
- `while` loops
- `return` statements

### LLVM IR Generation

The code generator uses llvmlite to build LLVM IR:
- Double-precision floating point (`double`) as primary numeric type
- 64-bit integers for indexing
- Runtime functions for complex array operations

### Optimization Pipeline

1. **Dead Code Elimination**: Remove instructions with no uses
2. **Loop Unrolling**: Duplicate loop body to reduce branch overhead
3. **Vectorization**: Generate SIMD instructions where possible
4. **Instruction Combining**: Fold constant expressions
5. **Constant Propagation**: Replace variable uses with known constants

## Limitations

- Current implementation: Framework complete, runtime integration ongoing
- Full end-to-end compilation requires additional runtime integration
- Complex control flow may have limited optimization
- Array shape inference is basic

## Future Work

- [ ] Complete runtime function integration
- [ ] Advanced array shape and type inference
- [ ] Better loop detection for unrolling
- [ ] Full SIMD code generation
- [ ] Support for multi-dimensional array operations
- [ ] GPU target support
- [ ] Interactive debugger for JIT-compiled code

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

This project is provided as-is for educational and research purposes.
