# OTA 固件升级管理平台

小型物联网设备 OTA 固件升级管理系统，包含 Java 后端管理平台和设备端模拟器。

## 功能特性

### 管理后台
- 固件上传管理（支持模拟上传）
- 固件版本列表查看
- 设备升级记录追踪
- 升级成功率统计
- 版本分布可视化
- 设备模拟器（网页端）

### 设备端 API
- `POST /api/device/check` - 检查固件更新
- `POST /api/device/report` - 上报升级结果
- `GET /api/firmware/download/{version}` - 下载固件

## 技术栈

### 后端
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库
- Maven

### 前端
- 原生 HTML5 + JavaScript
- CSS3 (无框架依赖)

### 设备模拟器
- Python 3 (requests 库)

## 快速开始

### 1. 启动后端服务

```bash
# 进入项目目录
cd ota-manager

# 使用 Maven 编译并启动
mvn spring-boot:run
```

或者先打包再运行：

```bash
mvn clean package
java -jar target/ota-manager-1.0.0.jar
```

服务启动后访问：
- 管理后台: http://localhost:8080
- H2 数据库控制台: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:ota_db`
  - 用户名: `sa`
  - 密码: (空)

### 2. 使用管理后台

1. 打开 http://localhost:8080
2. 在「固件上传」页面上传新固件（可选择真实文件或模拟上传）
3. 在「设备模拟」页面模拟设备检查更新和升级
4. 在「升级记录」页面查看所有升级记录
5. 在「统计分析」页面查看升级成功率和版本分布

### 3. 使用设备端模拟器

#### 交互模式
```bash
python device_simulator.py
```

#### 多设备模拟模式
```bash
python device_simulator.py --multi
```

设备模拟器会：
- 定期检查固件更新（默认每 60 秒）
- 模拟固件下载过程
- 模拟固件安装（90% 成功率）
- 自动上报升级结果

## API 接口文档

### 固件管理

#### 上传固件
```
POST /api/firmware/upload
Content-Type: multipart/form-data

参数:
- file: 固件文件 (.bin)
- version: 版本号 (如: 1.0.0)
- deviceModel: 设备型号
- description: 固件描述
```

#### 模拟上传固件
```
POST /api/firmware/upload-mock
Content-Type: application/json

{
    "version": "1.0.0",
    "deviceModel": "ESP32",
    "description": "Bug fixes",
    "fileName": "firmware_v1.bin",
    "fileSize": 1048576
}
```

#### 获取所有固件
```
GET /api/firmware/list
```

#### 获取指定型号的固件
```
GET /api/firmware/model/{deviceModel}
```

#### 获取最新固件
```
GET /api/firmware/latest/{deviceModel}
```

#### 删除固件
```
DELETE /api/firmware/{id}
```

### 设备端接口

#### 检查更新
```
POST /api/device/check
Content-Type: application/json

{
    "deviceId": "DEV001",
    "deviceModel": "ESP32",
    "currentVersion": "1.0.0"
}

响应:
{
    "upgradeAvailable": true,
    "version": "2.0.0",
    "description": "新功能",
    "downloadUrl": "/api/firmware/download/2.0.0",
    "fileSize": "1.00 MB",
    "releaseTime": "2024-01-01T12:00:00",
    "upgradeId": 1
}
```

#### 上报升级结果
```
POST /api/device/report
Content-Type: application/json

{
    "upgradeId": 1,
    "success": true,
    "failureReason": ""
}
```

#### 获取升级统计
```
GET /api/device/statistics
```

## 项目结构

```
ota-manager/
├── src/
│   └── main/
│       ├── java/com/ota/
│       │   ├── OtaManagerApplication.java    # 启动类
│       │   ├── config/
│       │   │   └── WebConfig.java            # Web 配置
│       │   ├── controller/
│       │   │   ├── FirmwareController.java   # 固件管理接口
│       │   │   └── DeviceController.java     # 设备端接口
│       │   ├── entity/
│       │   │   ├── Firmware.java             # 固件实体
│       │   │   └── DeviceUpgrade.java        # 升级记录实体
│       │   ├── repository/
│       │   │   ├── FirmwareRepository.java
│       │   │   └── DeviceUpgradeRepository.java
│       │   └── service/
│       │       ├── FirmwareService.java
│       │       └── DeviceUpgradeService.java
│       └── resources/
│           ├── application.yml               # 应用配置
│           └── static/
│               ├── index.html                # 管理后台首页
│               └── app.js                    # 前端逻辑
├── device_simulator.py                       # 设备端模拟器
├── pom.xml                                   # Maven 配置
└── README.md
```

## 支持的设备型号

- ESP32
- ESP8266
- STM32
- Arduino
- Raspberry Pi

可在 `index.html` 中添加更多型号。

## 版本号规则

采用语义化版本号格式：`主版本.次版本.修订号`

例如: `1.0.0` < `1.0.1` < `1.1.0` < `2.0.0`

## 注意事项

1. H2 数据库为内存数据库，服务重启后数据会丢失
2. 固件下载接口为模拟接口，不会真实传输文件
3. 设备模拟器的升级成功率为 90%，用于演示失败场景
4. 生产环境请替换为真实的文件存储和更安全的认证机制
