-- 初始化员工数据
INSERT INTO employees (employee_no, name, department, position, phone, email, created_at) VALUES
('E001', '张三', '技术部', '工程师', '13800138001', 'zhangsan@company.com', NOW()),
('E002', '李四', '市场部', '经理', '13800138002', 'lisi@company.com', NOW()),
('E003', '王五', '人事部', '主管', '13800138003', 'wangwu@company.com', NOW()),
('E004', '赵六', '财务部', '会计', '13800138004', 'zhaoliu@company.com', NOW()),
('E005', '孙七', '技术部', '高级工程师', '13800138005', 'sunqi@company.com', NOW());

-- 初始化课程数据
INSERT INTO courses (name, description, type, instructor, start_time, end_time, location, max_enrollment, status, created_at) VALUES
('Java编程基础', '面向初学者的Java编程入门课程，涵盖基础语法、面向对象等内容', '技能培训', '张老师', DATEADD('HOUR', 24, NOW()), DATEADD('HOUR', 30, NOW()), '培训室A', 30, 'PUBLISHED', NOW()),
('Python数据分析', '使用Python进行数据分析，包括Pandas、NumPy等库的使用', '技能培训', '李老师', DATEADD('HOUR', 48, NOW()), DATEADD('HOUR', 54, NOW()), '培训室B', 25, 'PUBLISHED', NOW()),
('职场沟通技巧', '提升职场沟通能力，学习有效沟通方法和技巧', '素养培训', '王老师', DATEADD('HOUR', 72, NOW()), DATEADD('HOUR', 75, NOW()), '培训室C', 40, 'PUBLISHED', NOW()),
('项目管理实战', 'PMP项目管理方法论与实战案例分析', '技能培训', '赵老师', DATEADD('HOUR', 96, NOW()), DATEADD('HOUR', 102, NOW()), '培训室A', 20, 'PUBLISHED', NOW()),
('团队建设与领导力', '培养团队管理能力和领导力素质', '素养培训', '孙老师', DATEADD('HOUR', 120, NOW()), DATEADD('HOUR', 123, NOW()), '培训室C', 35, 'PUBLISHED', NOW());
