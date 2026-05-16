# API 404错误修复说明

## 问题描述

在客户管理模块点击"创建跟进"时，填写完内容点击保存后前端报错：
```
POST http://localhost:8080/api/follow-up-records/customer/1 net::ERR_ABORTED 404 (Not Found)
```

## 根本原因

经过分析，发现了以下几个问题共同导致了这个错误：

### 1. JSON循环引用问题（主要原因）

**问题：** `Customer` 实体包含 `List<FollowUpRecord>` 字段，而 `FollowUpRecord` 实体又包含 `Customer` 字段。当Spring MVC尝试序列化返回的 `FollowUpRecord` 对象时，会陷入无限递归：
```
FollowUpRecord → Customer → List<FollowUpRecord> → FollowUpRecord → ...
```

这导致序列化失败，异常被捕获后返回404错误。

**修复方案：**
- 在 `Customer.followUpRecords` 字段上添加 `@JsonIgnore` 注解
- 在 `FollowUpRecord.customer` 字段上添加 `@JsonIgnoreProperties` 注解

### 2. 数据类型不匹配问题

**问题：** 前端发送的 `estimatedAmount` 是字符串类型（来自输入框），而后端期望的是 `BigDecimal` 类型。

**修复方案：**
- 前端在发送数据前将字符串转换为数字类型

### 3. 错误信息不清晰问题

**问题：** API请求失败时，前端只显示HTTP状态码，不显示具体的错误信息。

**修复方案：**
- 改进API请求的错误处理，尝试解析后端返回的JSON错误信息

## 修改的文件

### 后端 (Java)

1. **`backend/src/main/java/com/sales/entity/Customer.java`**
   - 添加 `@JsonIgnore` 注解到 `followUpRecords` 字段
   - 防止序列化时无限递归

2. **`backend/src/main/java/com/sales/entity/FollowUpRecord.java`**
   - 添加 `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "followUpRecords"})` 注解
   - 防止懒加载代理对象序列化问题和循环引用问题

3. **`backend/src/main/java/com/sales/config/JacksonConfig.java`** (新增)
   - 配置Jackson ObjectMapper
   - 注册JavaTimeModule以支持LocalDateTime序列化
   - 禁用日期序列化为时间戳

### 前端 (HTML/JS)

1. **`frontend/js/api.js`**
   - 改进错误处理逻辑
   - 尝试解析后端返回的JSON错误信息
   - 显示更友好的错误提示

2. **`frontend/follow-up.html`**
   - 修复 `estimatedAmount` 数据类型转换问题
   - 将字符串转换为浮点数

## 技术细节

### JSON循环引用修复

**修复前：**
```java
// Customer.java
@OneToMany(mappedBy = "customer")
private List<FollowUpRecord> followUpRecords;

// FollowUpRecord.java
@ManyToOne
private Customer customer;
```

**修复后：**
```java
// Customer.java
@OneToMany(mappedBy = "customer")
@JsonIgnore
private List<FollowUpRecord> followUpRecords;

// FollowUpRecord.java
@ManyToOne(fetch = FetchType.LAZY)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "followUpRecords"})
private Customer customer;
```

### 数据类型修复

**修复前：**
```javascript
const data = {
    estimatedAmount: document.getElementById('estimatedAmount').value || null
    // 发送的是字符串 "1000.00"
};
```

**修复后：**
```javascript
const estimatedAmountValue = document.getElementById('estimatedAmount').value;
const data = {
    estimatedAmount: estimatedAmountValue ? parseFloat(estimatedAmountValue) : null
    // 发送的是数字 1000.00
};
```

### 错误处理改进

**修复前：**
```javascript
if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}
```

**修复后：**
```javascript
if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object') {
            const messages = Object.values(errorData);
            if (messages.length > 0) {
                errorMessage = messages.join('; ');
            }
        }
    } catch (e) {
        // 忽略解析错误
    }
    throw new Error(errorMessage);
}
```

## 验证方法

1. **重启后端服务**：确保所有修改生效
2. **创建客户**：先创建一个测试客户
3. **创建跟进记录**：选择客户，填写内容、商机金额，点击保存
4. **验证结果**：应该成功创建并显示成功提示

## 相关联的其他潜在问题检查

检查了其他API端点是否存在类似问题：

| 端点 | 状态 | 说明 |
|------|------|------|
| GET /api/customers | ✅ 正常 | 客户列表不会序列化followUpRecords |
| GET /api/customers/{id} | ✅ 正常 | 单个客户不会序列化followUpRecords |
| PUT /api/customers/{id} | ✅ 正常 | 更新操作无序列化问题 |
| DELETE /api/customers/{id} | ✅ 正常 | 删除操作无序列化问题 |
| GET /api/follow-up-records | ⚠️ 已修复 | 返回列表时可能有循环引用 |
| GET /api/follow-up-records/{id} | ⚠️ 已修复 | 单个对象可能有循环引用 |
| PUT /api/follow-up-records/{id} | ⚠️ 已修复 | 更新后返回对象可能有循环引用 |
| GET /api/dashboard/* | ✅ 正常 | 仪表盘数据无循环引用 |

所有可能存在序列化问题的端点都已通过添加 `@JsonIgnore` 和 `@JsonIgnoreProperties` 注解修复。