# Reliable UDP File Transfer

基于UDP实现的可靠文件传输协议，类似QUIC简化版。

## 特性

- **连接建立**：1-RTT握手，快速建立连接
- **拥塞控制**：CUBIC算法，高效利用带宽
- **丢包重传**：基于ACK和NACK的可靠重传机制
- **前向纠错**：Reed-Solomon编码，每10个数据包加2个冗余包
- **多流复用**：单连接上可同时传输多个文件，每个流独立拥塞控制
- **大文件支持**：支持传输大于10GB的文件
- **乱序处理**：自动处理网络乱序和重复包
- **统计信息**：实时显示吞吐量、丢包率、重传率、RTT等

## 编译

```bash
mkdir build
cd build
cmake ..
make
```

Windows下使用Visual Studio：
```bash
mkdir build
cd build
cmake ..
cmake --build . --config Release
```

## 使用

### Receiver（接收端）
```bash
./receiver <端口> [输出目录]
```

示例：
```bash
./receiver 12345 ./downloads
```

### Sender（发送端）
```bash
./sender <服务器IP> <服务器端口> <文件1> [文件2] [文件3]...
```

示例：
```bash
./sender 127.0.0.1 12345 file1.bin file2.txt file3.iso
```

## 技术细节

### 数据包格式
```
- Magic (4字节)：协议标识
- Version (2字节)：版本号
- Type (1字节)：数据包类型
- Flags (1字节)：标志位
- Connection ID (4字节)：连接ID
- Stream ID (4字节)：流ID
- Sequence Number (8字节)：序列号
- Timestamp (8字节)：时间戳
- Payload Length (2字节)：负载长度
- Checksum (4字节)：校验和
- Payload (可变)：数据负载
```

### 拥塞控制
使用CUBIC算法，特点：
- TCP友好，在长肥网络中性能优异
- 拥塞窗口增长为立方函数
- RTT公平性，不同RTT流能公平分享带宽

### 前向纠错
使用Reed-Solomon编码：
- 每10个数据包生成2个冗余包
- 可容忍任意2个包丢失
- 无需重传即可恢复丢失数据

### 多流复用
- 单个UDP连接上可同时传输多个流
- 每个流有独立的拥塞控制和流量控制
- 流之间互不干扰，实现类似HTTP/2的多路复用

### 连接迁移
- 基于连接ID的寻址，不依赖IP:端口
- PATH_CHALLENGE/PATH_RESPONSE 路径验证机制
- 支持同时维护多条路径，自动选择最优路径
- 网络切换零中断，WiFi↔移动网络无缝切换
- 支持IPv4/IPv6双栈

详细说明请参考 [CONNECTION_MIGRATION.md](CONNECTION_MIGRATION.md)

## 统计信息

传输过程中实时显示：
- **吞吐量**：当前传输速率（Mbps）
- **丢包率**：丢失数据包百分比
- **重传率**：重传数据包百分比
- **RTT**：往返时间（毫秒）

传输完成后显示详细统计摘要。

## 注意事项

1. 确保防火墙允许UDP通信
2. 大文件传输建议使用稳定网络
3. 前向纠错会增加约20%的带宽开销，但在丢包环境下可显著提升性能
