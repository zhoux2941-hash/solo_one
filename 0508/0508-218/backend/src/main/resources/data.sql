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
