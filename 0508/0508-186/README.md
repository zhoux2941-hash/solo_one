# 销售管理系统

基于 Spring Boot 后端 + 原生 HTML/JS 前端的销售团队管理系统。

## 功能特性

### 1. 客户管理
- 客户信息录入（公司名称、联系人、电话）
- 客户等级设置（A/B/C级）
- 销售人员分配
- 客户信息编辑和删除

### 2. 跟进记录管理
- 填写沟通内容
- 设置下次联系时间
- 商机金额预估
- 跟进记录按客户/销售人员筛选

### 3. 自动成交概率计算
系统根据以下因素自动计算成交概率（0-100%）：
- **近30天跟进次数**：跟进越频繁，概率越高
- **商机金额变化趋势**：金额增长表示商机向好
- **客户等级**：A级客户权重最高，B级次之，C级最低

### 4. 销售经理仪表盘
- 预计季度成交总金额汇总
- 各销售人员预计完成金额排名
- 按成交概率排序的客户列表
- 近30天跟进统计

## 技术栈

### 后端
- Java 11
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- 原生 JavaScript (ES6+)
- 原生 CSS3

## 项目结构

```
sales-management/
├── backend/                 # Spring Boot 后端项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/sales/
│       │   ├── SalesManagementApplication.java    # 启动类
│       │   ├── config/                            # 配置类
│       │   ├── controller/                        # REST API控制器
│       │   ├── dto/                               # 数据传输对象
│       │   ├── entity/                            # 实体类
│       │   ├── repository/                        # 数据访问层
│       │   └── service/                           # 业务逻辑层
│       └── resources/
│           └── application.yml                    # 应用配置
│
└── frontend/                # 前端页面
    ├── css/
    │   └── style.css
    ├── js/
    │   └── api.js
    ├── index.html           # 客户管理页面
    ├── follow-up.html       # 跟进记录页面
    └── dashboard.html       # 经理仪表盘页面
```

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+

### 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 访问前端页面

直接在浏览器中打开 `frontend/index.html` 文件即可。

或者使用任意 HTTP 服务器托管前端文件，例如：

```bash
cd frontend
python -m http.server 8000
```

然后访问 `http://localhost:8000`

### H2 数据库控制台

后端启动后，可以通过以下地址访问 H2 数据库控制台：
`http://localhost:8080/h2-console`

连接信息：
- JDBC URL: `jdbc:h2:mem:salesdb`
- 用户名: `sa`
- 密码: (留空)

## API 接口

### 客户管理
- `GET /api/customers` - 获取所有客户
- `GET /api/customers/{id}` - 获取指定客户
- `GET /api/customers/salesperson/{name}` - 获取指定销售的客户
- `GET /api/customers/salespersons` - 获取所有销售人员列表
- `POST /api/customers` - 创建新客户
- `PUT /api/customers/{id}` - 更新客户信息
- `DELETE /api/customers/{id}` - 删除客户
- `POST /api/customers/{id}/calculate-probability` - 重新计算成交概率

### 跟进记录
- `GET /api/follow-up-records` - 获取所有跟进记录
- `GET /api/follow-up-records/{id}` - 获取指定跟进记录
- `GET /api/follow-up-records/customer/{customerId}` - 获取指定客户的跟进记录
- `GET /api/follow-up-records/salesperson/{name}` - 获取指定销售的跟进记录
- `POST /api/follow-up-records/customer/{customerId}` - 为客户添加跟进记录
- `PUT /api/follow-up-records/{id}` - 更新跟进记录
- `DELETE /api/follow-up-records/{id}` - 删除跟进记录

### 仪表盘
- `GET /api/dashboard/stats` - 获取仪表盘统计数据
- `GET /api/dashboard/customers` - 获取所有客户（含概率）

## 使用说明

1. **新增客户**：在客户管理页面点击"新增客户"，填写客户信息
2. **添加跟进记录**：点击客户列表中的"查看"按钮，进入跟进记录页面，添加跟进
3. **查看仪表盘**：点击导航栏的"经理仪表盘"，查看汇总数据
4. **筛选数据**：在各页面使用下拉菜单筛选客户或销售

## 成交概率计算公式

成交概率 = 跟进次数得分 + 金额趋势得分 + 客户等级得分

- 跟进次数得分 (最高40分)：
  - ≥5次：40分
  - ≥3次：30分
  - ≥1次：15分

- 金额趋势得分 (最高25分)：
  - 金额增长：25分
  - 金额不变：10分

- 客户等级得分 (最高35分)：
  - A级：35分
  - B级：20分
  - C级：5分