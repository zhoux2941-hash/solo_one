# 分页查询数据重复/丢失问题修复说明

## 问题描述

在跨页筛选订单数据时，出现以下问题：

### 问题 1：数据重复
- 同一条订单记录出现在多个页面
- 翻页时看到已经显示过的数据

### 问题 2：数据丢失
- 部分订单在所有页面都找不到
- 页面数据数量小于预期的 pageSize

## 问题根源分析

### 1. 排序不稳定（主要原因）

**原代码**：
```sql
ORDER BY created_at DESC
```

**问题**：
- 当多条订单有相同的 `created_at` 时间时，数据库返回顺序不确定
- 每次查询时，相同时间戳的记录排序可能不同
- 导致翻页时出现重复或丢失

### 2. OFFSET 分页偏移问题

**场景**：
- 用户在第 1 页时，有新订单插入
- 翻到第 2 页时，OFFSET 计算基于变化后的数据集
- 导致数据错位

### 3. 无去重保护

前端接收到数据后直接显示，没有防御性去重。

## 修复方案

### 方案 1：稳定排序（必须）

**修复后 SQL**：
```sql
ORDER BY created_at DESC, id DESC
```

**原理**：
- `id` 是自增主键，全局唯一且单调递增
- 即使 `created_at` 相同，`id` 也能保证排序稳定
- 任何时候查询相同条件，结果顺序一致

### 方案 2：后端去重（防御性）

在 `OrderService.queryOrders()` 中添加去重：

```java
List<Order> uniqueOrders = orders.stream()
        .collect(Collectors.toMap(
                Order::getOrderNo,
                order -> order,
                (existing, replacement) -> existing
        ))
        .values()
        .stream()
        .sorted((a, b) -> b.getId().compareTo(a.getId()))
        .collect(Collectors.toList());
```

### 方案 3：前端去重（双重保护）

前端使用 `Map` 按 `orderNo` 去重：

```javascript
const deduplicatePageOrders = (orders) => {
  const orderMap = new Map()
  for (const order of orders) {
    if (!orderMap.has(order.orderNo)) {
      orderMap.set(order.orderNo, order)
    }
  }
  return Array.from(orderMap.values())
}
```

### 方案 4：游标分页支持（可选优化）

新增基于 ID 的游标分页接口：

```sql
SELECT * FROM t_order
WHERE ...
  AND id < #{lastId}
ORDER BY id DESC
LIMIT #{pageSize}
```

**优点**：
- 不受数据插入/删除影响
- 大数据量下性能更好
- 天然防重复

**适用场景**：
- 滚动加载
- 超大数据集分页
- 实时性要求高的场景

## 修改文件清单

### 后端

1. **OrderMapper.xml**
   - `selectList` 添加 `id DESC` 排序
   - 新增 `selectListByCursor` 游标分页

2. **OrderMapper.java**
   - 新增 `selectListByCursor()` 方法

3. **OrderService.java**
   - `queryOrders()` 添加去重逻辑
   - 新增 `queryOrdersByCursor()` 游标分页

4. **OrderController.java**
   - 新增 `/api/orders/cursor` 游标分页接口

### 前端

1. **OrderList.vue**
   - 新增 `deduplicatePageOrders()` 去重函数
   - 分页切换时自动去重

2. **api/order.js**
   - 新增 `queryOrdersByCursor()` 接口

## 验证方法

### 1. 排序稳定性测试

**步骤**：
1. 创建 3 条订单，时间相同
2. 分页查询每页 1 条
3. 验证 3 页的订单不重复且覆盖所有数据

**预期**：
- 每页数据正确
- 无重复
- 无丢失

### 2. 并发插入测试

**步骤**：
1. 打开第 1 页
2. 同时批量插入 10 条新订单
3. 翻到第 2 页验证

**预期**：
- 第 2 页数据正确
- 不会漏掉原有的数据

### 3. 去重保护验证

**步骤**：
1. 故意构造重复的订单列表（模拟 SQL 异常）
2. 验证前端只显示去重后的结果

**预期**：
- 相同 orderNo 的订单只显示一次
- 页面正常渲染

## 使用建议

### 常规场景
使用原有 offset 分页接口，已足够稳定：
```javascript
queryOrders({ pageNum: 2, pageSize: 10, status: 'PAID' })
```

### 大数据量/高并发场景
推荐使用游标分页接口：
```javascript
// 第一页
queryOrdersByCursor({ pageSize: 20 })

// 第二页，传上一页最后一条的 ID
queryOrdersByCursor({ lastId: lastOrder.id, pageSize: 20 })
```

## 注意事项

1. **排序字段一致性**：所有分页查询必须包含 `id DESC` 作为最终排序
2. **去重粒度**：按 `orderNo` 去重，因为订单号是业务唯一标识
3. **性能影响**：当前页面大小（最多 100）下，去重操作的性能开销可忽略
4. **兼容性**：原有接口保持兼容，新增游标分页作为可选

## 预期效果

修复后：
- ✅ 同一条订单不会出现在多个页面
- ✅ 不会漏掉任何符合条件的订单
- ✅ 翻页体验流畅稳定
- ✅ 并发场景下数据一致性得到保证
