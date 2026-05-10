# 古琴调音工具 (Guqin Tuner)

一个专业的古琴调音辅助工具，帮助琴友计算徽位位置、检测音高偏差、记录和对比音准数据。

## 功能特性

### 1. 徽位位置计算
- 用户输入琴的有效弦长（mm）
- 自动计算1-13徽的理论位置
- 显示每个徽位距岳山和龙龈的距离
- 可视化展示弦长和徽位分布
- 提供古琴徽位理论知识说明

### 2. 实时音高检测
- 支持麦克风实时录音检测
- 支持上传音频文件分析
- 使用自相关算法（Autocorrelation）精确检测基频
- 显示实测频率和对应的音名
- 实时计算与理论频率的偏差（音分）

### 3. 音准记录管理
- 创建和管理多张古琴信息
- 记录每张琴的完整调音数据
- 保存所有13个徽位的音准偏差
- 查看历史调音记录和详细曲线
- 使用ECharts可视化音准偏差曲线

### 4. 多琴对比分析
- 对比多张琴的音准偏差曲线
- 统计数据对比（平均偏差、最大偏差、偏差范围）
- 各徽位详细数据对比表格
- 智能分析建议，提供调音指导

### 5. 智能调音提示
- 根据音分偏差提供分级建议
- 针对不同徽位提供具体调整建议
- 如："岳山处微偏低，可稍微向左移动琴轸"

## 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **Vue Router** - 单页应用路由管理
- **Vite** - 下一代前端构建工具
- **Axios** - HTTP客户端
- **ECharts** - 数据可视化图表库
- **Web Audio API** - 音频处理和音高检测

### 后端
- **Spring Boot 3.2** - Java企业级应用框架
- **Spring Data JPA** - 数据访问层
- **Spring Data Redis** - 缓存支持
- **MySQL 8** - 关系型数据库
- **Lombok** - Java代码简化工具

### 数据库设计
```
guqin (古琴表)
├── id (主键)
├── name (琴名)
├── string_length (有效弦长)
├── description (描述)
└── created_at/updated_at

tuning_record (调音记录表)
├── id (主键)
├── guqin_id (外键)
├── record_time (记录时间)
├── notes (备注)
└── created_at/updated_at

hui_position_detail (徽位音准详情)
├── id (主键)
├── tuning_record_id (外键)
├── hui_number (徽位编号 1-13)
├── theoretical_frequency (理论频率)
├── measured_frequency (实测频率)
├── cent_deviation (音分偏差)
└── created_at
```

## 项目结构

```
guqin-tuner/
├── frontend/                    # 前端Vue项目
│   ├── src/
│   │   ├── components/          # 组件目录
│   │   ├── utils/               # 工具函数
│   │   │   ├── huiPositionCalculator.js   # 徽位计算算法
│   │   │   └── pitchDetector.js           # 音高检测模块
│   │   ├── views/               # 页面视图
│   │   │   ├── HuiPositionCalculator.vue  # 徽位计算页
│   │   │   ├── PitchDetector.vue          # 音高检测页
│   │   │   ├── TuningRecords.vue          # 音准记录页
│   │   │   └── CompareInstruments.vue     # 琴音对比页
│   │   ├── router/              # 路由配置
│   │   ├── api/                 # API接口
│   │   ├── App.vue              # 根组件
│   │   └── main.js              # 入口文件
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── backend/                     # 后端Spring Boot项目
│   ├── src/main/
│   │   ├── java/com/guqin/tuner/
│   │   │   ├── GuqinTunerApplication.java
│   │   │   ├── config/          # 配置类
│   │   │   │   └── RedisConfig.java
│   │   │   ├── controller/      # 控制器
│   │   │   │   ├── GuqinController.java
│   │   │   │   ├── TuningRecordController.java
│   │   │   │   └── ComparisonController.java
│   │   │   ├── service/         # 业务层
│   │   │   │   ├── GuqinService.java
│   │   │   │   ├── TuningRecordService.java
│   │   │   │   └── ComparisonService.java
│   │   │   ├── mapper/          # 数据访问层
│   │   │   │   ├── GuqinRepository.java
│   │   │   │   ├── TuningRecordRepository.java
│   │   │   │   └── HuiPositionDetailRepository.java
│   │   │   └── entity/          # 实体类
│   │   │       ├── Guqin.java
│   │   │       ├── TuningRecord.java
│   │   │       ├── HuiPositionDetail.java
│   │   │       ├── HuiPositionDetailDTO.java
│   │   │       └── TuningRecordCreateDTO.java
│   │   └── resources/
│   │       ├── application.yml  # 应用配置
│   │       └── schema.sql       # 数据库脚本
│   └── pom.xml
│
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 18
- JDK >= 17
- MySQL >= 8.0
- Redis >= 6.0
- Maven >= 3.8

### 1. 数据库准备

```sql
-- 创建数据库
CREATE DATABASE guqin_tuner DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 或者使用项目中的脚本
-- 执行 backend/src/main/resources/schema.sql
```

### 2. 配置修改

修改 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/guqin_tuner?useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password
  
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password  # 可选
```

### 3. 启动后端

```bash
cd backend

# 使用Maven构建
mvn clean install

# 运行Spring Boot应用
mvn spring-boot:run

# 或者运行打包后的jar
java -jar target/tuner-1.0.0.jar
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

前端开发服务器将在 `http://localhost:5173` 启动。

### 5. 访问应用

打开浏览器访问: `http://localhost:5173`

## API接口说明

### 古琴管理
- `GET /api/guqin/list` - 获取所有古琴列表
- `GET /api/guqin/{id}` - 获取古琴详情
- `POST /api/guqin` - 创建古琴
- `PUT /api/guqin/{id}` - 更新古琴
- `DELETE /api/guqin/{id}` - 删除古琴

### 调音记录
- `GET /api/tuning-record/list/{guqinId}` - 获取某琴的所有记录
- `GET /api/tuning-record/{id}` - 获取记录详情
- `POST /api/tuning-record` - 创建调音记录
- `DELETE /api/tuning-record/{id}` - 删除记录
- `GET /api/tuning-record/latest-curve/{guqinId}` - 获取最新音准曲线

### 对比分析
- `POST /api/comparison/compare` - 对比多张琴的音准
- `GET /api/comparison/history/{guqinId}` - 获取历史曲线
- `GET /api/comparison/statistics/{guqinId}` - 获取统计数据

## 核心算法说明

### 徽位位置计算

古琴13个徽位的理论比例（基于纯律）：
- 一徽：1/8，二徽：1/6，三徽：1/5，四徽：1/4，五徽：1/3
- 六徽：2/5，七徽：1/2（中点）
- 八徽：3/5，九徽：2/3，十徽：3/4，十一徽：4/5，十二徽：5/6，十三徽：7/8

计算公式：
```
徽位位置 = 有效弦长 × 比例
理论频率 = 散音频率 / 比例
```

### 音高检测算法

使用自相关算法（Autocorrelation Algorithm）：

1. 计算音频信号的自相关函数
2. 寻找自相关函数的第一个有效峰值
3. 使用抛物线插值提高峰值位置精度
4. 转换为频率：`频率 = 采样率 / 峰值位置`

### 音分偏差计算

```
音分 = 1200 × log₂(实测频率 / 理论频率)
```

音分偏差等级：
- < 5音分：优秀（绿色）
- 5-15音分：良好（橙色）
- >15音分：需要调整（红色）

## 使用流程

1. **添加古琴** - 在"音准记录"页面添加你的古琴，输入琴名和有效弦长
2. **徽位计算** - 在"徽位计算"页面验证徽位位置
3. **音高检测** - 在"音高检测"页面：
   - 选择古琴和当前徽位
   - 输入散音频率（或使用默认值）
   - 点击"开始录音"，弹奏对应徽位
   - 记录当前徽位数据
   - 依次测量所有13个徽位
   - 保存完整记录
4. **对比分析** - 在"琴音对比"页面选择多张琴进行对比

## 注意事项

1. **浏览器支持** - 音高检测功能需要支持Web Audio API的现代浏览器（Chrome、Firefox、Edge等）
2. **麦克风权限** - 首次使用实时检测时需要授予麦克风权限
3. **环境噪音** - 建议在安静环境下使用，以获得更准确的检测结果
4. **缓存机制** - 系统使用Redis缓存数据，修改数据后会自动清除缓存

## 开发计划

- [ ] 支持更多调音方式（如泛音检测）
- [ ] 添加数据导出功能（PDF、Excel）
- [ ] 开发移动端应用
- [ ] 添加云端同步功能
- [ ] 集成AI调音建议

## 许可证

MIT License
