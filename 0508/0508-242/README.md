# 云盘同步客户端

使用 Java Swing 开发的轻量级桌面网盘同步客户端。

## 项目结构

```
cloud-sync-client/
├── pom.xml                          # Maven 配置文件
├── run.bat                          # Windows 启动脚本
├── README.md                        # 项目说明
└── src/main/java/com/cloudsync/
    ├── CloudSyncApplication.java    # 主入口类
    ├── entity/                      # 工具实体层
    │   ├── FileInfo.java            # 文件信息实体
    │   ├── SyncConfig.java          # 同步配置实体
    │   ├── SyncTask.java            # 同步任务实体
    │   └── SyncStats.java           # 同步统计实体
    ├── util/                        # 工具类
    │   ├── FileUtils.java           # 文件工具类
    │   └── ConfigManager.java       # 配置管理器
    ├── network/                     # 网络请求层
    │   └── CloudApiClient.java      # 网盘 API 客户端
    ├── sync/                        # 同步核心层
    │   ├── FileComparator.java      # 文件比对器
    │   ├── DirectoryWatcher.java    # 目录监听器
    │   └── SyncEngine.java          # 同步引擎
    └── ui/                          # 视图层
        ├── ConfigPanel.java         # 配置面板
        ├── SyncQueuePanel.java      # 同步队列面板
        ├── SyncProgressPanel.java   # 同步进度面板
        └── MainFrame.java           # 主窗口
```

## 功能特性

### 1. 本地目录监听模块
- 实时监控本地同步目录的文件变化
- 检测文件新增、修改、删除
- 自动触发同步操作

### 2. 云端文件比对模块
- 扫描本地文件并计算 MD5 哈希值
- 获取云端文件列表
- 比对文件差异，识别新增、修改和删除
- 基于修改时间判断文件新旧

### 3. 双向同步模块
- 支持上传同步（本地 → 云端）
- 支持下载同步（云端 → 本地）
- 支持增量同步，只同步变化的文件
- 区分新增上传、修改上传、新增下载、修改下载
- 支持配置单向同步模式（仅上传/仅下载）

### 4. 同步进度可视化模块
- 实时显示同步队列
- 进度条显示每个文件的同步进度
- 实时统计上传/下载/删除文件数量
- 实时显示传输速度和已传输数据量
- 显示总体同步进度

### 5. 账号本地配置模块
- 配置私有网盘服务地址
- 配置用户名和密码
- 配置本地同步目录
- 配置云端同步目录
- 配置同步间隔
- 支持连接测试
- 配置本地持久化保存（JSON 格式）

## 技术栈

- **Java 11** - 开发语言
- **Swing** - GUI 框架
- **Maven** - 项目构建
- **Gson** - JSON 序列化
- **Apache HttpClient** - HTTP 客户端
- **Apache Commons IO** - 文件操作工具

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+

### 编译运行

```bash
# 编译项目
mvn compile

# 运行（Windows）
run.bat

# 或直接运行
java -cp "target/classes;target/lib/*" com.cloudsync.CloudSyncApplication
```

### 使用步骤

1. **配置连接**
   - 切换到"配置"标签页
   - 填写网盘服务地址、用户名、密码
   - 选择本地同步目录
   - 点击"测试连接"验证配置
   - 点击"保存配置"

2. **开始同步**
   - 切换到"同步管理"标签页
   - 点击"开始同步"按钮
   - 查看同步队列和实时进度
   - 可暂停/停止同步操作

## 核心类说明

### entity 层
- **FileInfo**: 封装文件的路径、名称、大小、修改时间、MD5 哈希等信息
- **SyncConfig**: 存储同步配置参数，支持 JSON 序列化
- **SyncTask**: 表示单个同步任务，包含任务类型、进度、状态
- **SyncStats**: 统计同步过程中的各项指标

### util 层
- **FileUtils**: 提供文件 MD5 计算、目录扫描、大小格式化等功能
- **ConfigManager**: 配置管理器，单例模式，负责配置的加载和保存

### network 层
- **CloudApiClient**: 网盘 API 客户端，封装文件上传、下载、列表获取等网络操作

### sync 层
- **FileComparator**: 文件比对器，比较本地和云端文件差异，生成同步任务
- **DirectoryWatcher**: 目录监听器，后台线程监控本地目录变化
- **SyncEngine**: 同步引擎，核心调度器，管理同步任务队列和执行

### ui 层
- **ConfigPanel**: 配置面板，提供表单界面配置同步参数
- **SyncQueuePanel**: 同步队列面板，表格显示同步任务和进度
- **SyncProgressPanel**: 进度统计面板，显示实时统计信息
- **MainFrame**: 主窗口，整合所有面板，提供完整 GUI

## 配置文件

配置文件 `sync_config.json` 会自动生成在程序运行目录，示例：

```json
{
  "serverUrl": "http://your-cloud-server.com",
  "username": "your-username",
  "password": "your-password",
  "localSyncDir": "C:\\Users\\name\\SyncFolder",
  "remoteSyncDir": "/sync",
  "syncInterval": 30000,
  "autoStart": true,
  "uploadOnly": false,
  "downloadOnly": false
}
```

## 扩展说明

当前版本为演示版本，实际对接私有网盘时需要：

1. 在 `CloudApiClient.java` 中实现真实的 API 调用逻辑
2. 根据实际网盘 API 调整上传、下载接口
3. 实现认证 token 的获取和刷新机制
4. 处理网络异常和重试逻辑

## License

MIT
