# MemSafetyAnalyzer - 内存安全静态分析工具

基于LLVM开发的C语言静态分析工具，用于检测常见的内存安全问题。

## 功能特性

- **空指针解引用检测** (Null Pointer Dereference)
- **释放后使用检测** (Use-After-Free)
- **双重释放检测** (Double-Free)
- **内存泄漏检测** (Memory Leak)
- **不可达错误处理代码检测** (Unreachable Error Handler)
- **死错误路径检测** (Dead Error Code)

## 技术特点

- 上下文敏感分析 (Context-Sensitive)
- 路径敏感分析 (Path-Sensitive)
- 基于数据流分析和抽象解释
- 支持多种输出格式：TEXT、JSON、SARIF
- 可配置的检查类型
- 适合CI/CD集成

## 构建要求

- CMake >= 3.14
- LLVM >= 12.0
- Clang >= 12.0
- C++17 兼容编译器

## 构建步骤

```bash
mkdir build && cd build
cmake ..
make -j$(nproc)
```

## 使用方法

```bash
# 基本使用
./memsafety test.c

# 输出JSON格式
./memsafety -f json -o report.json test.c

# 输出SARIF格式 (用于CI/CD集成)
./memsafety -f sarif -o report.sarif test.c

# 禁用特定检查
./memsafety --no-memory-leak test.c

# 传递编译器参数
./memsafety test.c -- -I/path/to/include -DDEBUG
```

## 命令行选项

| 选项 | 说明 |
|------|------|
| `-h, --help` | 显示帮助信息 |
| `-v, --version` | 显示版本信息 |
| `-o, --output <file>` | 输出文件 |
| `-f, --format <format>` | 输出格式: text, json, sarif |
| `--verbose` | 详细输出 |
| `--debug` | 调试输出 |
| `--no-null-pointer` | 禁用空指针检查 |
| `--no-use-after-free` | 禁用UAF检查 |
| `--no-double-free` | 禁用双重释放检查 |
| `--no-memory-leak` | 禁用内存泄漏检查 |
| `--no-context-sensitive` | 禁用上下文敏感分析 |
| `--no-path-sensitive` | 禁用路径敏感分析 |
| `--max-path-depth <n>` | 最大路径深度 (默认: 50) |
| `--max-loop-unroll <n>` | 最大循环展开次数 (默认: 3) |
| `--timeout <seconds>` | 分析超时时间(秒), 0=禁用 (默认: 60) |
| `--max-memory <MB>` | 内存限制(MB), 0=禁用 (默认: 2048) |
| `--max-paths <n>` | 每个函数最大路径数 (默认: 1000) |
| `--max-function-size <n>` | 每个函数最大指令数,超过则跳过 (默认: 2000) |
| `--no-widening` | 禁用Widening(可能增加分析时间) |
| `--no-loop-detection` | 禁用循环检测 |
| `--no-function-skipping` | 禁用大函数跳过 |
| `--no-merge-at-joins` | 禁用汇合点状态合并 |
| `--widening-threshold <n>` | Widening触发阈值 (默认: 5) |

## 性能调优

### 大型代码库分析建议

对于包含大型函数（>1000行）或深度循环嵌套的代码，建议使用以下配置：

```bash
# 保守配置 - 速度优先，可能有少量漏报
./memsafety --no-path-sensitive --max-paths 100 large_file.c

# 平衡配置 - 性能和精度的平衡
./memsafety --timeout 120 --max-memory 4096 --max-paths 5000 large_file.c

# 激进配置 - 精度优先，较慢
./memsafety --timeout 300 --max-memory 8192 --max-function-size 5000 large_file.c
```

### 状态爆炸防护机制

工具内置多种机制防止状态爆炸：

1. **超时检测** - 防止分析无限期运行
2. **内存监控** - 当内存使用超过阈值时中止
3. **路径数限制** - 限制每个函数探索的路径数量
4. **循环检测与Widening** - 对循环应用抽象解释，避免无限展开
5. **函数大小限制** - 跳过过大的函数
6. **状态合并** - 在控制流汇合点合并状态
7. **状态裁剪** - 定期清理不必要的抽象状态

## 测试

```bash
# 运行所有测试
cd tests
../build/memsafety test_null_pointer.c
../build/memsafety test_use_after_free.c
../build/memsafety test_double_free.c
../build/memsafety test_memory_leak.c
../build/memsafety test_combined.c
../build/memsafety test_large_function.c
```

## 不可达错误处理代码检测

工具集成了可达性分析，能够检测以下类型的死代码：

### 检测类型

| 类型 | 说明 | CWE |
|------|------|-----|
| **UNREACHABLE_ERROR_HANDLER** | 永远不会被执行的错误处理标签/代码块 | CWE-561 |
| **DEAD_ERROR_CODE** | 错误条件恒为假的死分支 | CWE-570 |

### 识别的错误处理模式

- `goto error` / `goto err` 标签模式
- `if (0) { ... }` 恒假条件分支
- `if (sizeof(int) > 100)` 编译时常量假分支
- 包含 `free()`、`unlock()`、`return -1` 的清理代码块
- 调用 `abort()`、`exit()`、`log_error()` 的错误路径

### 与路径敏感分析的结合

可达性分析与路径敏感分析协同工作：
1. 首先进行可达性分析，识别基本块级别的不可达代码
2. 路径敏感分析利用可达性信息，避免在不可达路径上浪费资源
3. 对不可达的错误处理代码专门报告，帮助清理代码

### 示例

```c
int test() {
    int* ptr = malloc(sizeof(int));
    if (!ptr) {
        goto error;  // 可能可达
    }
    
    // ... 正常代码 ...
    
    free(ptr);
    return 0;
    
error:           // 如果前面的malloc永远成功，此块不可达
    free(ptr);   // 将被检测为UNREACHABLE_ERROR_HANDLER
    return -1;
}
```

## 性能指标

- 检出率: >80%
- 误报率: <15%
- 支持大规模代码库分析

## 支持的内存分配/释放函数

### 分配函数
- malloc, calloc, realloc
- aligned_alloc, posix_memalign, valloc
- xmalloc, zmalloc (Redis风格)

### 释放函数
- free, cfree
- xfree, zfree (Redis风格)
- realloc (也作为分配函数)

## CI/CD集成

工具支持SARIF格式输出，可直接集成到GitHub Actions、GitLab CI等CI/CD系统中。

### GitHub Actions 示例

```yaml
- name: Run Memory Safety Analysis
  run: |
    ./memsafety -f sarif -o memsafety.sarif src/
- name: Upload SARIF results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: memsafety.sarif
```

## 许可证

MIT License
