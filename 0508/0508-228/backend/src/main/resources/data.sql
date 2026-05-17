INSERT INTO sys_user (username, password, real_name, phone, email, role, status)
SELECT 'admin', '123456', '系统管理员', '13800138000', 'admin@construction.com', 'ADMIN', 1
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'admin');

INSERT INTO project (project_name, project_code, construction_address, construction_unit, contractor_unit, start_date, end_date, project_manager, manager_phone, description, status, archived)
SELECT '城市广场建设项目', 'PRJ-2024-001', '北京市朝阳区建国路88号', '北京城市建设投资集团', '中国建筑第八工程局', '2024-01-15', '2025-12-30', '张经理', '13900139001', '大型商业综合体建设项目，包含购物中心、写字楼、公寓等业态', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM project WHERE project_name = '城市广场建设项目');

INSERT INTO project (project_name, project_code, construction_address, construction_unit, contractor_unit, start_date, end_date, project_manager, manager_phone, description, status, archived)
SELECT '滨河住宅小区项目', 'PRJ-2024-002', '上海市浦东新区滨江大道66号', '上海地产集团', '上海建工集团', '2024-03-01', '2025-09-30', '李经理', '13900139002', '高品质住宅小区，包含12栋高层住宅及配套设施', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM project WHERE project_name = '滨河住宅小区项目');

INSERT INTO construction_area (project_id, area_name, area_code, area_type, building_unit, construction_section, manager_name, manager_phone, description, status)
SELECT 1, 'A区施工片区', 'AREA-A-001', '片区', '1号楼、2号楼', '一标段', '王工', '13800138001', 'A区主要施工区域，包含主体结构施工', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_area WHERE area_name = 'A区施工片区' AND project_id = 1);

INSERT INTO construction_area (project_id, area_name, area_code, area_type, building_unit, construction_section, manager_name, manager_phone, description, status)
SELECT 1, 'B区施工片区', 'AREA-B-001', '片区', '3号楼、4号楼', '二标段', '赵工', '13800138002', 'B区施工区域，包含商业裙楼施工', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_area WHERE area_name = 'B区施工片区' AND project_id = 1);

INSERT INTO construction_area (project_id, area_name, area_code, area_type, building_unit, construction_section, manager_name, manager_phone, description, status)
SELECT 2, '1号楼单元', 'BLDG-001', '楼栋', '1号楼', '一标段', '孙工', '13800138003', '1号楼住宅单元施工', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_area WHERE area_name = '1号楼单元' AND project_id = 2);

INSERT INTO material (project_id, material_name, material_code, material_type, specification, unit, unit_price, supplier, min_stock_quantity, description, status)
SELECT 1, 'HRB400螺纹钢', 'MAT-REBAR-001', '钢筋', 'Φ16mm', '吨', 4500.00, '河北钢铁集团', 50.00, '主体结构用钢筋', 1
WHERE NOT EXISTS (SELECT 1 FROM material WHERE material_name = 'HRB400螺纹钢' AND project_id = 1);

INSERT INTO material (project_id, material_name, material_code, material_type, specification, unit, unit_price, supplier, min_stock_quantity, description, status)
SELECT 1, 'P.O 42.5普通硅酸盐水泥', 'MAT-CEMENT-001', '水泥', 'P.O 42.5', '吨', 580.00, '中国建材集团', 100.00, '结构工程用水泥', 1
WHERE NOT EXISTS (SELECT 1 FROM material WHERE material_name = 'P.O 42.5普通硅酸盐水泥' AND project_id = 1);

INSERT INTO material (project_id, material_name, material_code, material_type, specification, unit, unit_price, supplier, min_stock_quantity, description, status)
SELECT 1, '中砂', 'MAT-SAND-001', '砂石', '细度模数2.3-3.0', '立方米', 120.00, '本地砂石场', 200.00, '混凝土用砂', 1
WHERE NOT EXISTS (SELECT 1 FROM material WHERE material_name = '中砂' AND project_id = 1);

INSERT INTO material (project_id, material_name, material_code, material_type, specification, unit, unit_price, supplier, min_stock_quantity, description, status)
SELECT 1, 'PVC-U排水管', 'MAT-PIPE-001', '管材', 'DN110', '米', 25.00, '联塑科技', 500.00, '给排水管道', 1
WHERE NOT EXISTS (SELECT 1 FROM material WHERE material_name = 'PVC-U排水管' AND project_id = 1);

INSERT INTO material_inventory (material_id, project_id, current_quantity, total_in_quantity, total_out_quantity, total_return_quantity)
SELECT 1, 1, 120.00, 150.00, 30.00, 0.00
WHERE NOT EXISTS (SELECT 1 FROM material_inventory WHERE material_id = 1);

INSERT INTO material_inventory (material_id, project_id, current_quantity, total_in_quantity, total_out_quantity, total_return_quantity)
SELECT 2, 1, 80.00, 200.00, 120.00, 0.00
WHERE NOT EXISTS (SELECT 1 FROM material_inventory WHERE material_id = 2);

INSERT INTO material_inventory (material_id, project_id, current_quantity, total_in_quantity, total_out_quantity, total_return_quantity)
SELECT 3, 1, 150.00, 300.00, 150.00, 0.00
WHERE NOT EXISTS (SELECT 1 FROM material_inventory WHERE material_id = 3);

INSERT INTO material_inventory (material_id, project_id, current_quantity, total_in_quantity, total_out_quantity, total_return_quantity)
SELECT 4, 1, 600.00, 1000.00, 400.00, 0.00
WHERE NOT EXISTS (SELECT 1 FROM material_inventory WHERE material_id = 4);

INSERT INTO material_in_out (project_id, material_id, bill_no, bill_type, quantity, unit_price, total_amount, handler, construction_area, supplier, remark, status)
SELECT 1, 1, 'RK202401150001', 'IN', 100.00, 4500.00, 450000.00, '张采购', 'A区施工片区', '河北钢铁集团', '第一批钢筋入库', 1
WHERE NOT EXISTS (SELECT 1 FROM material_in_out WHERE bill_no = 'RK202401150001');

INSERT INTO material_in_out (project_id, material_id, bill_no, bill_type, quantity, unit_price, total_amount, handler, construction_area, supplier, remark, status)
SELECT 1, 2, 'RK202401160001', 'IN', 200.00, 580.00, 116000.00, '张采购', 'A区施工片区', '中国建材集团', '第一批水泥入库', 1
WHERE NOT EXISTS (SELECT 1 FROM material_in_out WHERE bill_no = 'RK202401160001');

INSERT INTO material_in_out (project_id, material_id, bill_no, bill_type, quantity, unit_price, total_amount, handler, construction_area, supplier, remark, status)
SELECT 1, 1, 'CK202401200001', 'OUT', 30.00, 4500.00, 135000.00, '李工长', 'A区施工片区', '', 'A区基础施工领用钢筋', 1
WHERE NOT EXISTS (SELECT 1 FROM material_in_out WHERE bill_no = 'CK202401200001');

INSERT INTO construction_node (project_id, parent_id, node_name, node_code, node_type, node_order, planned_start_date, planned_end_date, planned_workload, completed_workload, progress_rate, responsible_person, responsible_phone, current_status, obstacles, description, status)
SELECT 1, NULL, '基础工程', 'NODE-001', '基础工程', 1, '2024-01-15', '2024-03-30', 100.00, 100.00, 100.00, '王工', '13800138001', 'COMPLETED', '', '项目基础施工阶段', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_node WHERE node_name = '基础工程' AND project_id = 1);

INSERT INTO construction_node (project_id, parent_id, node_name, node_code, node_type, node_order, planned_start_date, planned_end_date, planned_workload, completed_workload, progress_rate, responsible_person, responsible_phone, current_status, obstacles, description, status)
SELECT 1, 1, '土方开挖', 'NODE-001-01', '基础工程', 1, '2024-01-15', '2024-02-15', 30.00, 30.00, 100.00, '刘工', '13800138004', 'COMPLETED', '', '土方开挖及外运', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_node WHERE node_name = '土方开挖' AND project_id = 1);

INSERT INTO construction_node (project_id, parent_id, node_name, node_code, node_type, node_order, planned_start_date, planned_end_date, planned_workload, completed_workload, progress_rate, responsible_person, responsible_phone, current_status, obstacles, description, status)
SELECT 1, 1, '基础浇筑', 'NODE-001-02', '基础工程', 2, '2024-02-16', '2024-03-30', 70.00, 70.00, 100.00, '王工', '13800138001', 'COMPLETED', '', '混凝土基础浇筑', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_node WHERE node_name = '基础浇筑' AND project_id = 1);

INSERT INTO construction_node (project_id, parent_id, node_name, node_code, node_type, node_order, planned_start_date, planned_end_date, planned_workload, completed_workload, progress_rate, responsible_person, responsible_phone, current_status, obstacles, description, status)
SELECT 1, NULL, '主体结构工程', 'NODE-002', '主体工程', 2, '2024-04-01', '2024-10-31', 200.00, 120.00, 60.00, '赵工', '13800138002', 'IN_PROGRESS', '部分建材供应延迟', '主体结构施工阶段', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_node WHERE node_name = '主体结构工程' AND project_id = 1);

INSERT INTO construction_node (project_id, parent_id, node_name, node_code, node_type, node_order, planned_start_date, planned_end_date, planned_workload, completed_workload, progress_rate, responsible_person, responsible_phone, current_status, obstacles, description, status)
SELECT 1, NULL, '装饰装修工程', 'NODE-003', '装饰工程', 3, '2024-09-01', '2025-06-30', 150.00, 0.00, 0.00, '孙工', '13800138003', 'NOT_STARTED', '', '内外装饰装修施工', 1
WHERE NOT EXISTS (SELECT 1 FROM construction_node WHERE node_name = '装饰装修工程' AND project_id = 1);

INSERT INTO node_progress_report (node_id, project_id, report_date, reporter, completed_workload, progress_rate, work_content, obstacles, solutions, next_plan, weather_condition, worker_count, status)
SELECT 4, 1, '2024-05-10', '赵工', 40.00, 20.00, '完成1-3层主体框架浇筑，绑扎4层钢筋', '钢筋供应延迟2天', '已协调供应商紧急补货，增加夜间施工赶进度', '计划下周完成4-6层主体', '晴', 45, 1
WHERE NOT EXISTS (SELECT 1 FROM node_progress_report WHERE node_id = 4 AND report_date = '2024-05-10');

INSERT INTO node_progress_report (node_id, project_id, report_date, reporter, completed_workload, progress_rate, work_content, obstacles, solutions, next_plan, weather_condition, worker_count, status)
SELECT 4, 1, '2024-05-17', '赵工', 80.00, 40.00, '完成4-6层主体框架浇筑', '混凝土泵车故障半天', '联系备用泵车厂家，已恢复正常施工', '计划下周完成7-10层主体', '多云', 48, 1
WHERE NOT EXISTS (SELECT 1 FROM node_progress_report WHERE node_id = 4 AND report_date = '2024-05-17');

INSERT INTO node_progress_report (node_id, project_id, report_date, reporter, completed_workload, progress_rate, work_content, obstacles, solutions, next_plan, weather_condition, worker_count, status)
SELECT 4, 1, '2024-05-24', '赵工', 120.00, 60.00, '完成7-12层主体框架浇筑', '部分建材供应延迟', '已与供应商签订补充协议，确保后续供应', '计划月底完成地下车库主体', '晴', 50, 1
WHERE NOT EXISTS (SELECT 1 FROM node_progress_report WHERE node_id = 4 AND report_date = '2024-05-24');
