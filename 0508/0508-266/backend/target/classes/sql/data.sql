INSERT INTO sys_role (id, role_code, role_name, description, status) VALUES
(1, 'ADMIN', '系统管理员', '系统最高权限，负责用户管理、权限配置', 1),
(2, 'WAREHOUSE_KEEPER', '库管专员', '负责装备入库、出库、库存管理', 1),
(3, 'AUDITOR', '涉密审核员', '负责涉密装备的审批审核', 1),
(4, 'OPERATOR', '一线领用人员', '负责装备的领用申请', 1);

INSERT INTO sys_user (id, username, password, real_name, phone, dept_name, status) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '系统管理员', '13800000001', '信息中心', 1),
(2, 'warehouse', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张库管', '13800000002', '装备仓库', 1),
(3, 'auditor', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李审核', '13800000003', '保密处', 1),
(4, 'operator', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '王操作员', '13800000004', '作战部队', 1);

INSERT INTO sys_user_role (id, user_id, role_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 4, 4);

INSERT INTO sys_menu (id, parent_id, menu_name, menu_path, menu_component, menu_icon, menu_type, permission_code, sort_order, status) VALUES
(1, 0, '系统管理', '/system', NULL, 'setting', 1, NULL, 1, 1),
(2, 1, '用户管理', '/system/user', 'system/user/index', 'user', 1, 'system:user:list', 1, 1),
(3, 1, '角色管理', '/system/role', 'system/role/index', 'team', 1, 'system:role:list', 2, 1),
(4, 1, '菜单管理', '/system/menu', 'system/menu/index', 'menu', 1, 'system:menu:list', 3, 1),
(5, 0, '装备管理', '/equipment', NULL, 'box', 1, NULL, 2, 1),
(6, 5, '装备台账', '/equipment/list', 'equipment/list/index', 'list', 1, 'equipment:list', 1, 1),
(7, 5, '库存盘点', '/equipment/inventory', 'equipment/inventory/index', 'check', 1, 'equipment:inventory', 2, 1),
(8, 0, '审批管理', '/approval', NULL, 'audit', 1, NULL, 3, 1),
(9, 8, '我的申请', '/approval/my', 'approval/my/index', 'form', 1, 'approval:my', 1, 1),
(10, 8, '待我审批', '/approval/pending', 'approval/pending/index', 'clock-circle', 1, 'approval:pending', 2, 1),
(11, 8, '审批记录', '/approval/history', 'approval/history/index', 'history', 1, 'approval:history', 3, 1),
(12, 0, '日志审计', '/log', NULL, 'file-text', 1, NULL, 4, 1),
(13, 12, '操作日志', '/log/operation', 'log/operation/index', 'file', 1, 'log:operation:list', 1, 1);

INSERT INTO sys_role_menu (id, role_id, menu_id) VALUES
(1, 1, 1), (2, 1, 2), (3, 1, 3), (4, 1, 4), (5, 1, 5), (6, 1, 6), (7, 1, 7), (8, 1, 8), (9, 1, 9), (10, 1, 10), (11, 1, 11), (12, 1, 12), (13, 1, 13),
(14, 2, 5), (15, 2, 6), (16, 2, 7), (17, 2, 8), (18, 2, 10), (19, 2, 11),
(20, 3, 5), (21, 3, 6), (22, 3, 8), (23, 3, 10), (24, 3, 11), (25, 3, 12), (26, 3, 13),
(27, 4, 5), (28, 4, 6), (29, 4, 8), (30, 4, 9), (31, 4, 11);
