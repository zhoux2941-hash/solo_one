# Wireshark Plugin Suite (WPS)

Wireshark插件开发套件和自动化分析引擎，用于快速开发自定义协议解析器。

## 功能特性

### 核心功能
- **JSON驱动的协议描述**：使用JSON描述协议字段，无需手动编写Lua代码
- **自动Lua插件生成**：一键生成完整的Wireshark Lua解析插件
- **TCP流重组装**：自动处理TCP分段和乱序包，无需用户干预
- **启发式协议识别**：基于多特征加权评分自动识别协议

### 支持的字段类型
- 整数类型：uint8, uint16, uint32, uint64, int8, int16, int32, int64
- 网络类型：IPv4, IPv6, MAC地址
- 字符串：固定长度、变长、以零结尾
- 字节序列：固定长度、变长（引用长度字段）

### 高级特性
- **字段依赖**：根据某个字段的值决定后续字段是否存在
- **字节序配置**：支持大端/小端字节序
- **多线程PCAP分析**：支持10GB大文件在10分钟内处理完成
- **统计报表**：自动生成协议统计、TOP 10字段值、异常检测报告
- **异常检测**：自动识别异常字段值、重组装超时、不完整握手等

## 项目架构

```
┌─────────────────────────────────────────────────┐
│                  Python Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  CLI Tools  │  │   Plugin    │  │  Report  │ │
│  │             │  │  Manager    │  │ Generator│ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│  ┌─────────────┐  ┌─────────────┐                │
│  │ Lua Code    │  │ Pcap Analyzer                │ │
│  │ Generator   │  │ (Multi-threaded)             │ │
│  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────┐
│                   C++ Core                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Protocol  │  │  TCP Reasm  │  │ Heuristic│ │
│  │   Parser    │  │             │  │ Detector │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Pcap Reader │  │  Statistics │  │JSON Loader│ │
│  │             │  │   Engine    │  │          │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Wireshark Lua   │
                  │  Dissector Plugins│
                  └──────────────────┘
```

## 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd wireshark-plugin-suite

# 安装Python包
pip install -e .

# 编译C++核心库（可选，用于高性能分析）
mkdir build && cd build
cmake ..
make -j$(nproc)
```

### 使用流程

#### 1. 创建协议描述文件

```bash
# 生成模板
wps template -o my_protocol.json
```

编辑 `my_protocol.json` 描述您的协议：

```json
{
    "name": "my_protocol",
    "display_name": "My Custom Protocol",
    "short_name": "myproto",
    "default_port_tcp": 1234,
    "fields": [
        {
            "name": "magic",
            "display_name": "Magic Number",
            "type": "uint16",
            "offset": 0,
            "length": 2,
            "fixed_value": [0xAB, 0xCD]
        },
        {
            "name": "length",
            "display_name": "Payload Length",
            "type": "uint16",
            "offset": 2,
            "length": 2
        }
    ],
    "heuristic_rules": [
        {
            "type": "fixed_bytes",
            "name": "Magic Number",
            "offset": 0,
            "expected_bytes": [0xAB, 0xCD],
            "weight": 3.0
        }
    ]
}
```

#### 2. 验证协议描述

```bash
wps validate my_protocol.json
```

#### 3. 生成并安装插件

```bash
wps generate my_protocol.json --install
```

#### 4. 重启Wireshark

重启Wireshark后，新的协议解析器将自动生效。您可以在过滤栏中输入 `myproto` 来过滤该协议的数据包。

### 离线PCAP分析

```bash
# 分析PCAP文件并生成HTML报告
wps analyze capture.pcap -p my_protocol.json -f html -o report
```

这将生成：
- `report.html` - 交互式HTML报告
- `report.json` - 机器可读的JSON格式报告
- `report.txt` - 文本格式报告
- `report_*.csv` - CSV格式的数据表

## CLI命令参考

| 命令 | 描述 |
|------|------|
| `wps template` | 生成协议描述模板 |
| `wps validate <json>` | 验证协议描述文件 |
| `wps generate <json>` | 生成Lua插件 |
| `wps install <lua>` | 安装插件到Wireshark |
| `wps uninstall <name>` | 卸载插件 |
| `wps list` | 列出已安装的插件 |
| `wps analyze <pcap>` | 分析PCAP文件 |
| `wps test <lua>` | 测试插件 |

## 协议描述JSON格式

### 顶层字段

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 协议内部名称 |
| `display_name` | string | 是 | 协议显示名称 |
| `short_name` | string | 是 | 协议缩写（用于过滤） |
| `default_port_tcp` | int | 否 | 默认TCP端口 |
| `default_port_udp` | int | 否 | 默认UDP端口 |
| `requires_reassembly` | bool | 否 | 是否需要TCP重组装 |
| `fields` | array | 是 | 字段描述数组 |
| `heuristic_rules` | array | 否 | 启发式识别规则 |

### 字段描述

| 字段 | 类型 | 描述 |
|------|------|------|
| `name` | string | 字段名称 |
| `display_name` | string | 字段显示名称 |
| `type` | string | 字段类型 |
| `byte_order` | string | 字节序：`big_endian` / `little_endian` |
| `offset` | int | 字段偏移（-1表示顺序读取） |
| `length` | int | 字段长度（字节） |
| `is_variable_length` | bool | 是否变长字段 |
| `length_field` | string | 引用长度字段的名称 |
| `depends_on_field` | string | 依赖字段的名称 |
| `depends_on_condition` | string | 依赖条件（如 `== 1`） |
| `valid_values` | array | 有效值列表 |
| `fixed_value` | array | 固定期望值字节 |

### 启发式规则类型

1. **fixed_bytes**：固定偏移位置的字节序列
   ```json
   {
       "type": "fixed_bytes",
       "name": "Magic Number",
       "offset": 0,
       "expected_bytes": [0xAB, 0xCD],
       "weight": 3.0
   }
   ```

2. **port_range**：端口范围匹配
   ```json
   {
       "type": "port_range",
       "name": "Default Port",
       "port_min": 502,
       "port_max": 502,
       "weight": 2.0
   }
   ```

3. **entropy_range**：负载熵值范围
   ```json
   {
       "type": "entropy_range",
       "name": "Encrypted Data",
       "offset": 10,
       "entropy_min": 7.0,
       "entropy_max": 8.0,
       "weight": 1.0
   }
   ```

## 性能指标

- **PCAP处理速度**：~10GB in < 10 minutes（8核CPU）
- **内存占用**：< 2GB（处理10GB文件）
- **插件生成时间**：< 1秒
- **支持的并发流**：> 100,000 TCP流

## 目录结构

```
wireshark-plugin-suite/
├── include/                    # C++头文件
│   ├── common/                # 公共类型和工具
│   ├── core/                  # 核心解析逻辑
│   ├── pcap/                  # PCAP处理
│   └── stats/                 # 统计分析
├── src/                       # C++源文件
│   └── common/
├── python/                    # Python模块
│   ├── cli.py                 # 命令行接口
│   ├── protocol_description.py
│   ├── lua_generator.py
│   ├── plugin_manager.py
│   ├── analyzer.py
│   └── report_generator.py
├── examples/                  # 示例协议描述
│   ├── modbus_tcp.json
│   └── custom_protocol.json
├── tests/                     # 测试文件
├── CMakeLists.txt             # C++构建配置
└── setup.py                   # Python包配置
```

## 示例协议

项目包含两个示例协议描述：

1. **Modbus TCP** (`examples/modbus_tcp.json`)
   - 工业控制常用协议
   - 端口502
   - 包含字段依赖和变长字段

2. **Custom Industrial Protocol** (`examples/custom_protocol.json`)
   - 展示完整的协议描述功能
   - TCP重组装
   - 完整的启发式识别规则

## 运行测试

```bash
# 运行Python测试
pytest tests/ -v

# 运行C++测试（编译后）
cd build
ctest -V
```

## 故障排除

### 插件在Wireshark中不显示

1. 检查插件是否正确安装：`wps list`
2. 检查Wireshark插件目录：
   - Windows: `%APPDATA%\Wireshark\plugins\`
   - Linux: `~/.local/lib/wireshark/plugins/`
   - macOS: `~/.config/wireshark/plugins/`
3. 查看Wireshark控制台输出（Help -> About Wireshark -> Console）

### PCAP分析速度慢

1. 增加线程数：`-t 16`
2. 禁用启发式检测：`--no-heuristic`
3. 确保使用SSD存储

## 许可证

MIT License
