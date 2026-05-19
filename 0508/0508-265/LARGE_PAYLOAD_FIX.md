# 维修记录大文本提交问题修复说明

## 问题描述

前端运维维修记录编辑页面，当录入大量图文维修备注内容后，提交表单出现请求体过大报错（HTTP 413 Payload Too Large）。

## 根本原因

1. **数据库字段长度限制**：原实体类字段长度设置过小
   - `faultDescription`: 1000字符
   - `solution`: 1000字符  
   - `replacedParts`: 500字符

2. **Spring Boot默认请求体大小限制**：默认最大2MB

3. **Tomcat POST大小限制**：默认2MB

4. **前端缺少表单校验和提示**：用户不知道内容超限

---

## 修复方案

### 后端修改

#### 1. 数据库字段类型升级
**文件**: `entity/MaintenanceLog.java`

```java
// 修改前
@Column(length = 1000)
private String faultDescription;

// 修改后
@Lob
@Column(length = 10485760)  // 10MB
private String faultDescription;
```

- 使用 `@Lob` 注解标记为大对象字段
- 每个字段最大支持 10,485,760 字符（约10MB）
- H2数据库自动映射为 CLOB 类型

#### 2. Spring Boot配置
**文件**: `resources/application.yml`

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB

server.tomcat.max-http-form-post-size: 50MB
```

- 文件上传限制：50MB
- 请求体限制：50MB
- Tomcat POST大小：50MB

#### 3. Tomcat自定义配置
**文件**: `config/TomcatConfig.java`

```java
@Configuration
public class TomcatConfig {
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> containerCustomizer() {
        return factory -> {
            factory.addConnectorCustomizers(connector -> {
                connector.setMaxPostSize(100 * 1024 * 1024);  // 100MB
            });
        };
    }
}
```

- 完全解除Tomcat POST大小限制
- 支持最大100MB的POST请求

#### 4. Web MVC配置
**文件**: `config/WebMvcConfig.java`

- 统一CORS配置
- UTF-8编码强制设置

---

### 前端修改

#### 1. 表单增强
**文件**: `views/WorkOrderDetail.vue`

- 添加表单校验规则
- 增加字数统计显示
- 添加输入框最大长度限制
- 增加重置按钮
- 提交前二次确认

#### 2. 输入框配置

| 字段 | 最大长度 | 行数 | 说明 |
|------|---------|------|------|
| 故障描述 | 50,000字符 | 5行 | 实时字数统计 |
| 解决方案 | 50,000字符 | 5行 | 实时字数统计 |
| 更换配件 | 10,000字符 | 3行 | 实时字数统计 |

#### 3. API拦截器增强
**文件**: `api/index.js`

- 识别 HTTP 413 状态码
- 返回 `isPayloadTooLarge` 标记
- 提供友好的错误消息

#### 4. 错误处理增强

```javascript
catch (error) {
  if (error.isConflict) {
    // 并发冲突处理
  } else if (error.isPayloadTooLarge || error.response?.status === 413) {
    ElMessage.error('提交内容过大，请精简图文内容后重试')
  } else {
    // 其他错误
  }
}
```

---

## 支持能力

| 指标 | 修改前 | 修改后 |
|------|--------|--------|
| 单字段最大字符 | 1,000 | 50,000 |
| 数据库存储类型 | VARCHAR | CLOB |
| 请求体大小限制 | 2MB | 50MB |
| 字数统计提示 | 无 | 有 |
| 表单校验 | 无 | 有 |

---

## 使用建议

1. **纯文本内容**：可以放心录入，支持数万字符
2. **图文混排**：建议文字描述，图片使用附件上传功能（如需要可扩展）
3. **性能考虑**：单条记录建议控制在1MB以内，超过时考虑分多条记录
4. **数据备份**：定期备份H2数据库文件，防止数据丢失

---

## 涉及文件清单

| 类型 | 文件 | 说明 |
|------|------|------|
| ✨新增 | `config/TomcatConfig.java` | Tomcat大请求配置 |
| ✨新增 | `config/WebMvcConfig.java` | Web MVC配置 |
| ✨新增 | `LARGE_PAYLOAD_FIX.md` | 修复说明文档 |
| 🔧修改 | `entity/MaintenanceLog.java` | 字段长度和类型升级 |
| 🔧修改 | `resources/application.yml` | 请求体大小配置 |
| 🔧修改 | `views/WorkOrderDetail.vue` | 表单增强和校验 |
| 🔧修改 | `api/index.js` | 413错误识别 |
