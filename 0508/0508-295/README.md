# USB设备指纹识别系统
==========================

基于时钟偏移和电气特性的USB设备识别系统（支持虚拟机环境优化）

## 功能特性

- USB设备枚举和时间戳采集
- 基于时钟偏移特征提取
- 随机森林机器学习模型
- REST API后端服务
- 命令行工具
- 设备注册和认证
- 黑名单管理
- 支持HID、存储、网络等设备类型
- **虚拟机环境噪声自适应优化**
- **设备型号识别和分类**
- **基于型号白名单/黑名单策略**

## 虚拟机环境优化

针对虚拟机环境中USB设备指纹不稳定的问题，系统实现了以下优化：

### 1. 鲁棒数据预处理
- **异常值过滤**: 组合使用Z-score和IQR方法移除噪声点
- **数据平滑**: 移动平均+中值滤波组合处理
- **虚拟机检测**: 自动识别高噪声环境并采用更强的降噪

### 2. 抗噪声特征
- 使用**中位数**替代均值
- 使用**MAD（中位数绝对偏差）**替代标准差
- 使用**IQR（四分位距）**替代方差
- 基于分位数的偏度和峰度计算

### 3. 自适应机制
- **噪声水平估计**: 自动计算信噪比
- **阈值动态调整**: 虚拟机环境使用更低的相似度阈值
- **特征权重自适应**: 高噪声环境下更依赖稳定特征

### 4. 多会话融合
- 支持3次以上采集会话
- 多次采集取中位数获得稳定指纹
- 自动融合多次采样结果

## 配置参数

默认配置已针对虚拟机环境优化：
- 常规采样数: 100（原为50）
- 虚拟机采样数: 200
- 常规认证阈值: 0.85
- 虚拟机认证阈值: 0.75

## 设备型号识别

系统支持基于设备描述符字符串和VID/PID的设备型号识别和授权管理：

### 1. 型号匹配机制
- **精确匹配**: 基于Vendor ID和Product ID
- **字符串模式匹配**: 支持通配符的厂商和产品名称匹配
- **设备类型分类**: HID、存储、网络、打印机等
- **分类管理**: 按设备类别进行授权

### 2. 策略管理
- **白名单模式**: 只允许已授权型号的设备访问
- **黑名单模式**: 阻止特定型号的设备访问
- **多维度控制**: 可按型号、厂商、类别、类型设置策略
- **策略优先级**: 黑名单 > 白名单

### 3. 集成认证流程
认证时自动进行型号识别和策略检查：
- 识别设备型号
- 检查型号授权状态
- 应用访问策略
- 记录完整的认证日志

## 系统要求

- Python 3.8+
- libusb 1.0+

## 安装

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 安装libusb

**Windows:**
- 下载 [libusb-win32 或 libusb1
- 使用Zadig工具为设备安装驱动

**Linux:**
```bash
sudo apt-get install libusb-1.0-0-dev
```

**macOS:**
```bash
brew install libusb
```

### 3. 安装项目

```bash
pip install -e .
```

## 使用方法

### CLI命令

#### 列出连接的USB设备
```bash
usb-fingerprint device list
```

#### 采集设备时间样本
```bash
usb-fingerprint device capture 0x1234 0x5678
```

#### 注册设备
```bash
usb-fingerprint device register 0x1234 0x5678
```

#### 认证设备
```bash
usb-fingerprint device authenticate 0x1234 0x5678
```

#### 列出已注册设备
```bash
usb-fingerprint device registered
```

#### 设备型号管理
```bash
# 列出所有型号
usb-fingerprint model list

# 添加设备型号
usb-fingerprint model add "Kingston U盘" 0x0951 0x1666 \
    --vendor-pattern "Kingston*" \
    --product-pattern "*DataTraveler*" \
    --device-type "Mass Storage" \
    --category "Storage" \
    --authorized

# 删除型号
usb-fingerprint model delete <model_id>
```

#### 访问策略管理
```bash
# 列出所有策略
usb-fingerprint policy list

# 添加黑名单策略
usb-fingerprint policy blacklist --vendor-id 0x1234 --reason "未授权厂商"
usb-fingerprint policy blacklist --model-id <model_id> --reason "未授权型号"
usb-fingerprint policy blacklist --device-type "HID" --reason "禁止HID设备"

# 添加白名单策略
usb-fingerprint policy whitelist --vendor-id 0x0951 --reason "授权厂商"

# 删除策略
usb-fingerprint policy delete <policy_id>
```

#### 设备黑名单管理
```bash
usb-fingerprint blacklist add <device_id>
usb-fingerprint blacklist remove <device_id>
usb-fingerprint blacklist list
```

#### 启动API服务器
```bash
usb-fingerprint server --host 0.0.0.0 --port 8000
```

#### 监控热插拔事件
```bash
usb-fingerprint monitor
```

## REST API

启动服务器后，访问 `http://localhost:8000/docs` 查看完整的API文档。

### 主要API端点

#### 设备管理
- `GET /devices/usb` - 列出所有连接的USB设备
- `POST /devices/register` - 注册设备
- `POST /devices/authenticate` - 认证设备
- `GET /devices` - 列出所有已注册设备
- `GET /devices/{device_id}` - 获取设备详情
- `DELETE /devices/{device_id}` - 删除设备

#### 设备型号管理
- `GET /models` - 列出所有设备型号
- `POST /models` - 添加/更新设备型号
- `DELETE /models/{model_id}` - 删除设备型号

#### 访问策略管理
- `GET /policies` - 列出所有访问策略
- `POST /policies` - 创建访问策略
- `DELETE /policies/{policy_id}` - 删除访问策略

#### 其他
- `POST /blacklist` - 设备添加到黑名单
- `DELETE /blacklist/{device_id}` - 从黑名单移除设备
- `GET /model/importance` - 查看特征重要性

## 工作原理

### 1. 数据采集

系统通过libusb捕获USB设备枚举过程中的SETUP包响应时间，采集多个时间样本。

### 2. 特征提取

从采集的时间样本中提取以下特征：

- 响应时间统计（均值、标准差、方差）
- 分位数（25%、50%、75%）
- 偏度和峰度
- 变异系数
- 自相关系数
- 时钟漂移估计（ppm）

### 3. 机器学习

使用随机森林分类器进行设备识别。模型学习每个设备的指纹特征，并在认证时进行匹配。

### 4. 认证流程

1. 用户插拔USB设备
2. 系统捕获设备时间戳
3. 提取指纹特征
4. 使用模型预测设备ID
5. 检查黑名单状态
6. 返回认证结果

## 项目结构

```
usb_fingerprint/
├── __init__.py          # 包初始化
├── config.py            # 配置文件
├── database.py          # 数据库模型
├── usb_capture.py       # USB数据采集
├── feature_extractor.py # 特征提取
├── ml_model.py         # 机器学习模型
├── api.py              # REST API服务
└── cli.py              # 命令行工具
```

## 数据库

系统使用SQLite数据库存储：

- 设备信息和指纹向量
- 设备操作历史
- 黑名单状态

## 注意事项

1. **权限问题**: 在Linux上需要root权限或配置udev规则
2. **驱动问题**: Windows上需要为设备安装libusb驱动
3. **样本数量**: 建议采集至少50个样本以获得稳定的特征
4. **阈值调整**: 根据需求调整认证阈值（默认0.7）

## 开发

### 运行测试

```bash
python -m pytest tests/
```

### 添加新设备类型

在 `usb_capture.py` 的 `_detect_device_type` 方法中添加新的设备类检测逻辑。

## 许可证

MIT License
