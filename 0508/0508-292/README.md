# Coverage-Guided Fuzzer

一个类似AFL/libFuzzer的覆盖率引导模糊测试引擎，使用Python开发。

## 功能特性

- **基于突变的种子生成器**
  - 位翻转 (Bit flip)
  - 字节翻转 (Byte flip)
  - 算术运算 (Arithmetic increment/decrement)
  - 插入/删除字节
  - 数据块复制
  - 交叉突变
  - 字典支持

- **覆盖率追踪**
  - 边缘覆盖率 (Edge coverage)
  - 共享内存通信
  - 实时覆盖率统计

- **测试引擎**
  - Fork Server 模式
  - Crash 和 Hang 检测
  - 语料库自动扩充
  - 多进程并行执行

- **Web 界面**
  - 实时测试进度
  - 覆盖率变化图表
  - Crash 列表展示
  - 美观的仪表板

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 基础用法

```bash
python fuzz.py ./examples/vulnerable
```

### 带Web界面

```bash
python fuzz.py ./examples/vulnerable --web-port 5000
```

### 并行执行

```bash
python fuzz.py ./examples/vulnerable -j 4
```

### 使用字典

```bash
python fuzz.py ./examples/vulnerable -d dict/example.dict
```

### 禁用Web界面

```bash
python fuzz.py ./examples/vulnerable --no-web
```

### 完整参数

```
usage: fuzz.py [-h] [-c CORPUS] [-o CRASHES] [-d DICT] [-t TIMEOUT] [-j JOBS]
               [--web-port WEB_PORT] [--no-web]
               target

Coverage-Guided Fuzzer - Similar to AFL/libFuzzer

positional arguments:
  target                Path to the target program to fuzz

optional arguments:
  -h, --help            show this help message and exit
  -c CORPUS, --corpus CORPUS
                        Directory to store corpus files (default: corpus)
  -o CRASHES, --crashes CRASHES
                        Directory to store crash files (default: crashes)
  -d DICT, --dict DICT  Path to dictionary file for mutations
  -t TIMEOUT, --timeout TIMEOUT
                        Timeout per execution in seconds (default: 5)
  -j JOBS, --jobs JOBS  Number of parallel worker processes (default: CPU count - 1)
  --web-port WEB_PORT   Port for the web UI (default: 5000)
  --no-web              Disable the web UI
```

## 构建示例程序

```bash
cd examples
make
```

示例程序包含以下可触发的漏洞：
- `FUZZ + 0xdeadbeef` -> abort()
- `FUZZ + 0xcafebabe` -> 栈溢出
- `FUZZ + 0x13371337` -> 空指针解引用
- `STACK + ...` -> 栈缓冲区溢出
- `HEAP + ...` -> 堆缓冲区溢出

## 项目结构

```
.
├── fuzz.py              # 主入口脚本
├── requirements.txt     # Python依赖
├── src/
│   ├── __init__.py
│   ├── mutator/         # 突变引擎
│   │   ├── __init__.py
│   │   └── mutator.py
│   ├── coverage/        # 覆盖率追踪
│   │   ├── __init__.py
│   │   ├── coverage.py
│   │   └── SanitizerCoverage.cpp
│   ├── engine/          # Fuzzing引擎
│   │   ├── __init__.py
│   │   ├── fuzzer.py
│   │   └── forkserver.py
│   ├── web/             # Web界面
│   │   ├── __init__.py
│   │   └── server.py
│   └── parallel.py      # 多进程支持
├── examples/            # 示例目标程序
│   ├── vulnerable.c
│   └── Makefile
├── dict/                # 字典文件
│   └── example.dict
├── corpus/              # 语料库目录 (自动创建)
└── crashes/             # Crash目录 (自动创建)
```

## Web界面

启动后访问 http://localhost:5000 查看实时仪表板：

- 总执行次数
- 每秒执行速度
- 已覆盖的边数
- 语料库大小
- 发现的Crash数量
- Hang数量
- 执行速度图表
- 覆盖率进度条
- 最近Crash列表

## 注意事项

1. 确保目标程序从stdin读取输入
2. 建议使用AddressSanitizer编译目标程序以获得更好的漏洞检测
3. 多进程模式下每个worker有独立的覆盖率追踪
4. 按Ctrl+C停止fuzzing并查看总结

## 技术细节

- **覆盖率追踪**: 通过共享内存实现，目标程序写入执行轨迹，fuzzer读取并分析新覆盖的边
- **Fork Server**: 每个测试用例通过fork创建子进程执行，避免进程启动开销
- **语料库管理**: 发现新覆盖率的输入自动加入语料库供后续突变使用
- **字典支持**: 从字典文件中提取token用于智能突变，提高发现复杂路径的效率
