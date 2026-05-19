# 工单流程引擎并发控制说明

## 概述

为解决多人同时审批同一张工单出现流程状态错乱的问题，系统实现了**双重并发控制机制**：

1. **乐观锁机制** - 基于JPA `@Version` 实现数据库层面的版本控制
2. **状态前置校验** - 业务层面的状态校验，防止非法状态流转

---

## 实现方案

### 1. 乐观锁机制

在 `WorkOrder` 实体中添加版本字段：

```java
@Version
private Integer version;
```

**工作原理**：
- 首次保存工单时，`version = 0`
- 每次更新工单时，版本号自动 `+1`
- 更新条件中自动加入 `version = 当前版本号`
- 如果版本不匹配，抛出 `ObjectOptimisticLockingFailureException`

### 2. 状态前置校验

在所有修改工单状态的方法中，先校验当前状态是否允许操作：

| 操作 | 允许的前置状态 | 校验内容 |
|------|---------------|---------|
| 组长审批 | PENDING | 1. 工单状态必须是PENDING<br>2. 组长审批状态必须是PENDING |
| 管理员审批 | LEADER_APPROVED | 1. 工单状态必须是LEADER_APPROVED<br>2. 管理员审批状态必须是PENDING |
| 工单分配 | ADMIN_APPROVED | 1. 工单状态必须是ADMIN_APPROVED<br>2. 未分配处理人 |
| 工单认领 | ADMIN_APPROVED, ASSIGNED | 1. 状态必须是ADMIN_APPROVED或ASSIGNED<br>2. 未被其他人认领 |
| 提交维修记录 | IN_PROGRESS | 1. 工单必须是进行中<br>2. 未完成 |

---

## 异常处理

### 自定义异常

`ConcurrentOperationException` - 并发操作异常

### 全局异常处理器

`GlobalExceptionHandler` 统一处理：

1. **乐观锁异常** (`OptimisticLockingFailureException`)
   - HTTP状态码：409 CONFLICT
   - 返回消息："该工单已被其他用户处理，请刷新页面后重试"

2. **自定义并发异常** (`ConcurrentOperationException`)
   - HTTP状态码：409 CONFLICT
   - 返回消息：具体的业务校验失败原因

### 前端处理

API拦截器自动识别并发冲突错误：

```javascript
if (error.response && error.response.status === 409) {
  const data = error.response.data
  if (data && data.errorCode === 'CONCURRENT_CONFLICT') {
    return Promise.reject({
      isConflict: true,
      message: data.message || '操作冲突，请刷新页面后重试'
    })
  }
}
```

页面捕获后：
1. 显示具体的错误提示消息
2. 自动刷新工单数据

---

## 工单状态流转图

```
                    ┌─────────────┐
                    │   PENDING   │ ◄── 创建工单
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 组长审批     │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼─────────┐     ┌─────────▼─────────┐
    │  LEADER_APPROVED  │     │     REJECTED      │
    └─────────┬─────────┘     └───────────────────┘
              │
    ┌─────────▼─────────┐
    │   管理员审批      │
    └─────────┬─────────┘
              │
  ┌───────────┴───────────┐
  │                       │
┌─▼─────────┐   ┌─────────▼─────────┐
│ADMIN_APP  │   │     REJECTED      │
└────┬──────┘   └───────────────────┘
     │
┌────▼──────┐
│ 分配/认领 │
└────┬──────┘
     │
┌────▼──────┐
│IN_PROGRESS│
└────┬──────┘
     │
┌────▼──────┐
│  COMPLETED│
└───────────┘
```

---

## 使用示例

### 场景1：两人同时审批同一张工单

1. 用户A和用户B同时打开工单 #001（状态PENDING，version=0）
2. 用户A先点击"通过" → 审批成功，version变为1
3. 用户B点击"通过" → 由于版本不匹配，抛出并发异常
4. 前端提示："该工单已被其他用户处理，请刷新页面后重试"
5. 自动刷新页面，显示最新状态

### 场景2：重复审批

1. 用户A审批通过工单 #001
2. 用户A再次点击"通过" → 状态前置校验失败
3. 前端提示："该工单已被其他组长审批，当前状态：APPROVED"

---

## 注意事项

1. **事务边界**：所有状态修改方法都使用 `@Transactional` 保证原子性
2. **版本自动管理**：JPA自动管理版本号，无需手动操作
3. **幂等性**：重复操作不会破坏数据一致性
4. **前端刷新**：发生并发冲突后必须重新加载最新数据
5. **用户体验**：给出明确的错误提示，让用户知道发生了什么

---

## 涉及文件

| 文件路径 | 说明 |
|---------|------|
| `entity/WorkOrder.java` | 添加@Version字段 |
| `exception/ConcurrentOperationException.java` | 自定义并发异常 |
| `exception/GlobalExceptionHandler.java` | 全局异常处理器 |
| `service/WorkOrderService.java` | 添加状态前置校验 |
| `service/MaintenanceLogService.java` | 添加状态前置校验 |
| `frontend/src/api/index.js` | API拦截器处理并发冲突 |
| `frontend/src/views/WorkOrderDetail.vue` | 页面级错误处理 |
