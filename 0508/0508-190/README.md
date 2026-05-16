# IT资产管理系统

一个完整的企业IT资产管理系统，包含资产入库、领用审批、归还管理和统计报表功能。

## 技术栈

- **后端**: Java 8 + Spring Boot 2.7 + Spring Data JPA + H2 数据库
- **前端**: 原生 HTML + CSS + JavaScript

## 项目结构

```
asset-management/
├── backend/                 # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/asset/
│   │       │   ├── model/          # 实体类
│   │       │   ├── repository/     # 数据访问层
│   │       │   ├── service/        # 业务逻辑层
│   │       │   ├── controller/     # 控制器
│   │       │   ├── config/         # 配置
│   │       │   └── AssetManagementApplication.java
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
└── frontend/                # 前端项目
    ├── index.html
    ├── style.css
    └── app.js
```

## 功能特性

### 1. 资产入库
- 录入资产编号、类型、品牌、购买日期等信息
- 自动设置初始状态为"在库"
- 防止资产编号重复

### 2. 资产领用
- 员工选择可领用资产提交申请
- 填写申请人姓名、部门、申请原因
- 选择预计归还日期

### 3. 审批管理
- IT管理员查看待审批申请
- 审批通过或拒绝
- 审批通过后自动更新资产状态为"已领用"

### 4. 资产归还
- 查看所有已领用资产
- 标记资产归还，状态更新为"在库"
- 记录归还检查备注
- 超期30天的资产高亮显示

### 5. 报表统计
- 各部门资产领用率统计
- 待归还资产列表（超期30天高亮显示）
- 可视化进度条展示领用率

## 快速开始

### 后端启动

1. 确保已安装 JDK 8+ 和 Maven

2. 进入后端目录：
```bash
cd backend
```

3. 编译并运行：
```bash
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 前端启动

1. 直接在浏览器中打开 `frontend/index.html` 文件即可

## API 接口

### 资产相关
- `GET /api/assets` - 获取所有资产
- `GET /api/assets/{id}` - 获取单个资产
- `GET /api/assets/status/{status}` - 按状态获取资产
- `POST /api/assets` - 新增资产
- `PUT /api/assets/{id}` - 更新资产
- `DELETE /api/assets/{id}` - 删除资产
- `PUT /api/assets/{id}/return` - 归还资产
- `PUT /api/assets/{id}/status` - 更新资产状态
- `GET /api/assets/overdue` - 获取超期资产
- `GET /api/assets/statistics/departments` - 部门统计

### 申请相关
- `GET /api/applications` - 获取所有申请
- `GET /api/applications/{id}` - 获取单个申请
- `GET /api/applications/status/{status}` - 按状态获取申请
- `POST /api/applications` - 提交申请
- `PUT /api/applications/{id}/approve` - 审批通过
- `PUT /api/applications/{id}/reject` - 审批拒绝

## H2 数据库控制台

启动后端后，可通过 http://localhost:8080/h2-console 访问H2数据库控制台：

- JDBC URL: `jdbc:h2:mem:assetdb`
- 用户名: `sa`
- 密码: (空)

## 数据字典

### 资产状态 (AssetStatus)
- `IN_STOCK` - 在库
- `ALLOCATED` - 已领用
- `UNDER_REPAIR` - 维修中

### 资产类型 (AssetType)
- `LAPTOP` - 笔记本电脑
- `MONITOR` - 显示器
- `KEYBOARD` - 键盘
- `MOUSE` - 鼠标
- `HEADSET` - 耳机
- `DOCKING_STATION` - 扩展坞
- `OTHER` - 其他

### 申请状态 (ApplicationStatus)
- `PENDING` - 待审批
- `APPROVED` - 已通过
- `REJECTED` - 已拒绝
