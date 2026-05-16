# 输入验证修复说明

## 修复的问题

### 1. 电话号码输入问题
**问题描述：** 客户管理模块点击新增客户时，电话可以随意输入中文并且没有长度限制。

**修复方案：**
- **前端实时过滤：** 输入时自动过滤中文字符和其他非法字符
- **前端验证：** 提交时进行格式和长度验证
- **后端验证：** 使用JPA注解进行服务端验证

### 2. 其他字段验证补充
**公司名称：**
- 必填，长度2-100字符

**联系人：**
- 必填，长度2-50字符

**负责人/销售人员：**
- 可选，最多50字符

**跟进记录内容：**
- 必填，1-2000字符

## 修复的文件

### 后端 (Java)

1. **`backend/src/main/java/com/sales/entity/Customer.java`**
   - 添加 `@Size` 注解限制各字段长度
   - 添加 `@Pattern` 正则验证电话号码格式
   - 验证规则：
     - 电话：7-20字符，只允许数字、空格、+、-、(、)
     - 公司名称：2-100字符
     - 联系人：2-50字符
     - 负责人：最多50字符

2. **`backend/src/main/java/com/sales/entity/FollowUpRecord.java`**
   - 添加 `@Size` 注解限制字段长度
   - 验证规则：
     - 沟通内容：1-2000字符
     - 销售人员：最多50字符

3. **`backend/src/main/java/com/sales/config/GlobalExceptionHandler.java`**
   - 新增全局异常处理器
   - 捕获验证异常并返回友好的错误信息

### 前端 (HTML/JS)

1. **`frontend/js/api.js`**
   - 新增 `ValidationUtils` 工具类
   - 包含各种验证方法：
     - `validatePhone()` - 电话号码验证
     - `validateCompanyName()` - 公司名称验证
     - `validateContactPerson()` - 联系人验证
     - `validateSalesperson()` - 销售人员验证
     - `validateContent()` - 沟通内容验证
     - `preventInvalidPhoneInput()` - 实时过滤非法输入
     - `limitInputLength()` - 限制输入长度

2. **`frontend/index.html` (客户管理)**
   - 添加输入框 `maxlength` 属性
   - 添加实时输入事件监听器
   - 添加提交前验证逻辑
   - 电话号码输入实时过滤中文和非法字符

3. **`frontend/follow-up.html` (跟进记录)**
   - 添加输入框 `maxlength` 属性
   - 添加字符计数显示
   - 添加提交前验证逻辑
   - 商机金额添加最小限制（不能为负）

4. **`frontend/css/style.css`**
   - 添加 `.error` 样式类
   - 错误状态红色边框和淡红背景

## 验证规则说明

### 电话号码格式验证
**允许的字符：**
- 数字 (0-9)
- 加号 (+)
- 减号 (-)
- 空格
- 括号 ( () )

**长度限制：** 7-20个字符

**示例合法号码：**
- 138******78
- 010-12345678
- +86 138******78
- (010)12345678

### 其他字段验证

| 字段 | 必填 | 最小长度 | 最大长度 | 说明 |
|------|------|----------|----------|------|
| 公司名称 | 是 | 2 | 100 | - |
| 联系人 | 是 | 2 | 50 | - |
| 电话 | 是 | 7 | 20 | 格式受限 |
| 负责人 | 否 | 0 | 50 | - |
| 沟通内容 | 是 | 1 | 2000 | 跟进记录 |
| 销售人员 | 否 | 0 | 50 | 跟进记录 |

## 使用示例

### 前端验证使用
```javascript
// 验证电话号码
const result = ValidationUtils.validatePhone('138******78');
if (result.valid) {
    console.log('验证通过');
} else {
    console.log('验证失败:', result.message);
}

// 实时过滤输入
document.getElementById('phone').addEventListener('input', ValidationUtils.preventInvalidPhoneInput);
```

### 后端验证使用
Controller中已添加 `@Valid` 注解，验证失败会自动返回400错误：
```json
{
  "phone": "电话号码只能包含数字、空格、+、-、(、)",
  "companyName": "公司名称长度必须在2-100个字符之间"
}
```

## 安全特性

1. **双重验证：** 前端和后端都进行验证，确保数据合法性
2. **实时过滤：** 非法字符在输入时就被过滤，提升用户体验
3. **友好提示：** 验证失败时显示清晰的错误提示
4. **长度限制：** 防止超长输入导致的潜在问题