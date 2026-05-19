# AR 室内导航应用

基于 ARCore 的 Android 室内导航应用，使用视觉惯性里程计(VIO)实现精准定位，无需额外信标设备。

## 核心功能

### 1. 视觉惯性定位 (VIO)
- 使用 ARCore 实现 6DOF 追踪
- 实时定位漂移计算与警告 (< 0.5米/100米)
- 平滑位置处理和速度计算

### 2. 空间锚点系统
- 在平面上创建持久化锚点
- 云端锚点存储与共享
- 多锚点漂移校准

### 3. POI 标记系统
- 支持多种 POI 类型:
  - 会议室
  - 工位
  - 卫生间
  - 楼梯/电梯
  - 出口
- 实时位置记录

### 4. AR 导航指引
- 3D 箭头指示前进方向
- 蓝色路径线显示导航路径
- 距离实时计算与显示
- 到达目的地自动检测

### 5. 多楼层导航
- 垂直平面检测
- 基于高度的楼层自动切换
- 楼梯/电梯识别
- 跨楼层路径规划

### 6. 地图数据管理
- Room 数据库本地存储
- Retrofit 后端同步
- 多人地图共享

## 技术架构

```
app/
├── ar/                    # AR 核心模块
│   ├── ARSessionManager      # ARCore 会话管理
│   ├── VIOPositionManager    # VIO 定位管理器
│   └── NavigationGuideRenderer # 导航渲染器
├── database/              # 数据库层
│   ├── AppDatabase           # Room 数据库
│   ├── AnchorDao             # 锚点 DAO
│   ├── POIDao                # POI DAO
│   ├── FloorDao              # 楼层 DAO
│   └── MapDao                # 地图 DAO
├── model/                 # 数据模型
│   ├── Vector3               # 3D 向量
│   ├── AnchorData            # 锚点数据
│   ├── POI                   # 兴趣点
│   ├── FloorMap              # 楼层地图
│   ├── NavigationPath        # 导航路径
│   └── MapData               # 地图数据
├── api/                   # 网络 API
│   ├── BackendApi            # 后端接口
│   └── RetrofitClient        # Retrofit 客户端
├── navigation/            # 导航算法
│   └── PathCalculator        # A* 路径计算器
└── MainActivity          # 主界面
    └── ARNavigationActivity  # AR 导航界面
```

## 系统要求

- Android 7.0 (API 24) 或更高版本
- 支持 ARCore 的设备
- 相机权限
- 网络权限 (用于地图同步)

## 构建说明

1. 确保安装了 Android SDK 和 Gradle
2. 克隆项目到本地
3. 使用 Android Studio 打开项目
4. 同步 Gradle 依赖
5. 连接支持 ARCore 的 Android 设备
6. 运行应用

## 使用指南

### 基础操作
1. 启动应用，授予相机权限
2. 移动手机扫描环境，检测平面
3. 点击平面创建空间锚点
4. 点击"标记POI"添加兴趣点
5. 点击"导航"选择目的地开始导航

### 楼层切换
- 手动: 使用 +/- 按钮切换楼层
- 自动: 移动到楼梯/电梯区域时自动检测

### 导航过程
- 绿色箭头指示当前行进方向
- 蓝色线条显示规划路径
- 顶部显示剩余距离和导航进度

## 后端 API 接口

应用包含后端服务接口，支持:
- 地图创建与更新
- 锚点同步
- POI 管理
- 云端路径计算
- 地图共享

## 定位精度保证

应用采用多种技术保证定位精度:
1. **多锚点融合**: 使用多个参考锚点校准漂移
2. **VIO 优化**: 视觉与惯性传感器融合
3. **实时监控**: 漂移超过阈值时警告
4. **平滑处理**: 历史位置加权平滑

## 开发计划

- [ ] iOS ARKit 版本
- [ ] 云端锚点同步优化
- [ ] 语音导航指引
- [ ] 多人实时位置共享
- [ ] 离线地图下载
- [ ] AR 眼镜支持

## 许可证

MIT License