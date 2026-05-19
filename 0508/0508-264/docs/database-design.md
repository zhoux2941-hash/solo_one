# 数据库设计文档

## 概述
企业级订单管理系统采用 H2 内存数据库，支持多租户架构。

## 核心表结构

### 1. 租户表 (tenants)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| tenant_code | VARCHAR(50) | 租户编码 | UNIQUE, NOT NULL |
| tenant_name | VARCHAR(100) | 租户名称 | NOT NULL |
| contact_person | VARCHAR(50) | 联系人 | |
| contact_phone | VARCHAR(20) | 联系电话 | |
| email | VARCHAR(100) | 邮箱 | |
| address | VARCHAR(255) | 地址 | |
| status | VARCHAR(20) | 状态 | DEFAULT 'ACTIVE' |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

### 2. 用户表 (users)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| tenant_id | BIGINT | 租户ID | NOT NULL |
| username | VARCHAR(50) | 用户名 | UNIQUE, NOT NULL |
| password | VARCHAR(255) | 密码 | NOT NULL |
| real_name | VARCHAR(50) | 真实姓名 | |
| email | VARCHAR(100) | 邮箱 | |
| phone | VARCHAR(20) | 手机号 | |
| department_id | BIGINT | 部门ID | |
| status | VARCHAR(20) | 状态 | DEFAULT 'ACTIVE' |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

### 3. 角色表 (roles)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| tenant_id | BIGINT | 租户ID | NOT NULL |
| role_code | VARCHAR(50) | 角色编码 | UNIQUE |
| role_name | VARCHAR(50) | 角色名称 | NOT NULL |
| description | VARCHAR(255) | 描述 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

### 4. 权限表 (permissions)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| parent_id | BIGINT | 父级ID | |
| permission_code | VARCHAR(100) | 权限编码 | UNIQUE, NOT NULL |
| permission_name | VARCHAR(100) | 权限名称 | NOT NULL |
| type | VARCHAR(20) | 类型(MENU/BUTTON/API) | |
| path | VARCHAR(255) | 路由路径 | |
| component | VARCHAR(255) | 组件路径 | |
| icon | VARCHAR(50) | 图标 | |
| sort_order | INT | 排序 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

### 5. 用户角色关联表 (user_roles)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| user_id | BIGINT | 用户ID | PRIMARY KEY |
| role_id | BIGINT | 角色ID | PRIMARY KEY |

### 6. 角色权限关联表 (role_permissions)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| role_id | BIGINT | 角色ID | PRIMARY KEY |
| permission_id | BIGINT | 权限ID | PRIMARY KEY |

### 7. 商品表 (products)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| tenant_id | BIGINT | 租户ID | NOT NULL |
| product_name | VARCHAR(200) | 商品名称 | NOT NULL |
| sku_code | VARCHAR(50) | SKU编码 | UNIQUE |
| category | VARCHAR(100) | 分类 | |
| brand | VARCHAR(100) | 品牌 | |
| unit | VARCHAR(20) | 单位 | |
| cost_price | DECIMAL(15,2) | 成本价 | |
| sale_price | DECIMAL(15,2) | 售价 | |
| vip_price | DECIMAL(15,2) | 会员价 | |
| stock_quantity | INT | 库存数量 | DEFAULT 0 |
| warn_quantity | INT | 预警数量 | DEFAULT 10 |
| barcode | VARCHAR(50) | 条码 | |
| specifications | TEXT | 规格 | |
| image_url | VARCHAR(255) | 图片URL | |
| status | VARCHAR(20) | 状态 | DEFAULT 'ACTIVE' |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

### 8. 订单表 (orders)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| tenant_id | BIGINT | 租户ID | NOT NULL |
| order_no | VARCHAR(50) | 订单号 | UNIQUE, NOT NULL |
| customer_id | BIGINT | 客户ID | NOT NULL |
| customer_name | VARCHAR(100) | 客户名称 | |
| total_amount | DECIMAL(15,2) | 订单总额 | NOT NULL |
| discount_amount | DECIMAL(15,2) | 优惠金额 | DEFAULT 0 |
| pay_amount | DECIMAL(15,2) | 实付金额 | |
| status | VARCHAR(30) | 订单状态 | DEFAULT 'DRAFT' |
| pay_status | VARCHAR(20) | 支付状态 | DEFAULT 'UNPAID' |
| shipping_address | VARCHAR(255) | 收货地址 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT | 创建人ID | |
| approved_by | BIGINT | 审批人ID | |
| approved_at | TIMESTAMP | 审批时间 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

### 9. 订单明细表 (order_items)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键 | PRIMARY KEY, AUTO_INCREMENT |
| order_id | BIGINT | 订单ID | NOT NULL |
| product_id | BIGINT | 商品ID | NOT NULL |
| product_name | VARCHAR(200) | 商品名称 | |
| sku_code | VARCHAR(50) | SKU编码 | |
| quantity | INT | 数量 | NOT NULL |
| unit_price | DECIMAL(15,2) | 单价 | NOT NULL |
| discount_amount | DECIMAL(15,2) | 优惠金额 | DEFAULT 0 |
| subtotal | DECIMAL(15,2) | 小计 | |
| remark | VARCHAR(255) | 备注 | |

## 订单状态枚举
- DRAFT: 草稿
- PENDING_APPROVAL: 待审批
- APPROVED: 已审批
- PROCESSING: 处理中
- SHIPPED: 已发货
- DELIVERED: 已送达
- COMPLETED: 已完成
- CANCELLED: 已取消
- REFUNDED: 已退款

## 支付状态枚举
- UNPAID: 未支付
- PAID: 已支付
- PARTIAL_REFUND: 部分退款
- REFUNDED: 全额退款

## 索引建议
1. orders - tenant_id, status, created_at
2. products - tenant_id, category, sku_code
3. users - tenant_id, username
