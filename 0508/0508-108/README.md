# 律师函生成工具

基于 JavaFX + Apache Derby 嵌入式数据库的本地律师函快速生成工具。

## 功能特性

- **模板库**：预设3种常用律师函模板
  - 催款函（DEMAND）
  - 侵权警告函（WARNING）
  - 合同催告函（REMINDER）
- **单文件生成**：选择模板 -> 填写表单 -> 点击生成
- **历史记录**：保存每次生成记录，支持搜索、重新编辑
- **批量生成**：同一个模板，批量处理多个对方对象

## 技术栈

- Java 17+
- JavaFX 21
- Apache Derby（嵌入式数据库）
- Apache POI（Word文档生成）
- Maven

## 项目结构

```
src/main/
├── java/com/lawyer/letter/
│   ├── Main.java                    # 程序入口
│   ├── controller/
│   │   └── MainController.java      # 主界面控制器
│   ├── model/
│   │   ├── BatchItem.java           # 批量生成项
│   │   ├── LetterRecord.java        # 生成记录
│   │   └── LetterTemplate.java      # 函件模板
│   ├── service/
│   │   ├── RecordService.java       # 记录服务
│   │   └── TemplateService.java     # 模板服务
│   └── util/
│       ├── DatabaseManager.java     # Derby数据库管理
│       └── WordGenerator.java       # Word文档生成
└── resources/
    └── fxml/
        └── main.fxml                # 主界面布局
```

## 快速开始

### 1. 环境准备

安装以下软件：
- JDK 17 或更高版本
- Maven 3.6+

配置环境变量：
```bash
JAVA_HOME=C:\Program Files\Java\jdk-17
MAVEN_HOME=C:\Program Files\Apache\maven
PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%
```

### 2. 编译运行

```bash
# 编译项目
mvn clean compile

# 运行程序
mvn javafx:run
```

### 3. 打包发布

```bash
# 打包为可执行JAR（包含所有依赖）
mvn clean package

# 运行打包后的程序
java -jar target/lawyer-letter-generator.jar
```

## 使用说明

### 单文件生成

1. 选择模板类型（催款函/侵权警告函/合同催告函）
2. 查看模板预览，了解格式
3. 填写表单中的所有字段
4. 点击"生成律师函"按钮
5. 选择保存目录，文件将自动生成

### 批量生成

1. 在"批量生成"标签页选择模板
2. 填写公共字段（委托人、律师事务所、经办律师）
3. 在"公共字段"区域填写所有文件共用的字段
4. 在"批量数据"区域按行输入对方信息：
   - 格式：`对方名称,地址,金额`
   - 每行一个记录，逗号分隔
   - 示例：
     ```
     张三科技有限公司,北京市海淀区中关村大街1号,100000
     李四贸易公司,上海市浦东新区世纪大道100号,50000
     ```
5. 点击"批量生成"按钮，选择保存目录

### 历史记录

1. 在"历史记录"标签页查看所有生成记录
2. 支持按委托人或对方名称搜索
3. 双击记录可加载到表单重新编辑
4. 选中记录后可打开生成的Word文件或删除记录

## 模板占位符

| 占位符 | 说明 |
|--------|------|
| `client` | 委托人/当事人 |
| `lawyer_office` | 律师事务所名称 |
| `lawyer_address` | 律师事务所地址 |
| `lawyer_phone` | 律师电话 |
| `lawyer_fax` | 律师传真 |
| `lawyer_name` | 经办律师 |
| `counterparty` | 对方公司/个人名称 |
| `counterparty_address` | 对方地址 |
| `fact_description` | 事实描述（催款） |
| `amount` | 金额 |
| `deadline_date` | 截止日期 |
| `days` | 要求期限（天） |
| `bank_name` | 开户银行 |
| `bank_account` | 银行账号 |
| `right_type` | 权利类型（侵权） |
| `right_description` | 权利描述 |
| `infringement_fact` | 侵权事实 |
| `contract_date` | 合同签订日期 |
| `contract_name` | 合同名称 |
| `contract_terms` | 合同条款摘要 |
| `performance_status` | 履行情况 |
| `current_date` | 当前日期（自动生成） |

## 数据库

- 使用 Apache Derby 嵌入式数据库
- 数据库文件位于：`./letter_db/`
- 首次运行自动创建表结构和默认模板

## 注意事项

1. 首次运行需要联网下载 Maven 依赖
2. 生成的 Word 文档格式为 `.docx`（Office 2007+）
3. 建议使用宋体字体查看文档，确保中文显示正常

## 开发扩展

### 添加新模板

在 `DatabaseManager.java` 的 `initializeDefaultTemplates()` 方法中添加新的模板 SQL 语句，或者创建管理界面动态添加模板。

### 自定义字段

修改 `LetterTemplate` 表的 `placeholder_list` 字段，用逗号分隔占位符名称，控制器会自动根据占位符列表动态生成表单字段。
