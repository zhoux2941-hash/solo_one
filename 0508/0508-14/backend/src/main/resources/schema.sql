CREATE DATABASE IF NOT EXISTS doc_search DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE doc_search;

CREATE TABLE IF NOT EXISTS documents (
    doc_id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    click_count INT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_category (category),
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS search_logs (
    search_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(500) NOT NULL,
    user_id VARCHAR(100),
    clicked_doc_id VARCHAR(100),
    timestamp DATETIME NOT NULL,
    result_count INT,
    INDEX idx_keyword (keyword),
    INDEX idx_timestamp (timestamp),
    INDEX idx_doc_id (clicked_doc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO documents (doc_id, title, content, category, click_count, created_at, updated_at) VALUES
('doc-001', '2024年度财务报告分析', '本年度公司整体业绩稳步增长，净利润同比增长15%。主要业务板块表现如下：1. 主营业务收入增长12%；2. 研发投入增加20%；3. 海外市场拓展取得突破性进展。未来一年将继续聚焦核心业务，加强创新研发。', '财务', 0, NOW(), NOW()),
('doc-002', '产品需求文档 - 用户管理模块', '用户管理模块功能包括：用户注册、登录、个人信息管理、权限管理。支持手机号、邮箱、第三方登录方式。管理员可进行用户审核、角色分配、批量操作等。系统日志记录所有用户操作。', '产品', 0, NOW(), NOW()),
('doc-003', 'Java开发规范手册', '本规范涵盖Java开发中的命名规范、代码格式、异常处理、并发编程、数据库操作等方面。所有开发人员必须严格遵守。代码审查中发现违反规范的问题必须修复后方可合并。', '技术', 0, NOW(), NOW()),
('doc-004', '市场部Q1工作总结', '第一季度市场推广活动：品牌发布会、行业展会3次、线上直播5场。获取有效线索2000条，转化率15%。品牌曝光量提升30%。下季度计划增加短视频营销投入。', '市场', 0, NOW(), NOW()),
('doc-005', '人力资源招聘流程优化方案', '为提高招聘效率，建议优化以下流程：1. 简历筛选自动化；2. 面试流程标准化；3. 面试官培训体系；4. 候选人体验优化。预计可将平均招聘周期从45天缩短至30天。', '人力', 0, NOW(), NOW()),
('doc-006', '数据库性能优化指南', 'SQL优化要点：1. 避免SELECT *；2. 合理使用索引；3. 批量操作替代循环；4. 分页查询优化。常用优化工具：EXPLAIN分析、慢查询日志、性能监控系统。', '技术', 0, NOW(), NOW()),
('doc-007', '年度预算编制说明', '预算编制原则：战略导向、资源匹配、风险可控。各部门需于每月5日前提交月度预算执行报告。超预算支出需提前申请审批。年底进行预算调整和决算工作。', '财务', 0, NOW(), NOW()),
('doc-008', '员工培训发展计划', '2024年培训计划：新员工入职培训、岗位技能培训、管理能力培训、行业知识更新。每位员工年度培训时长不少于40小时。培训效果与绩效评估挂钩。', '人力', 0, NOW(), NOW()),
('doc-009', '移动端应用UI设计规范', '设计原则：简洁、一致、可访问、反馈及时。颜色规范：主色#1890FF，辅助色#52C41A，警告色#FAAD14，危险色#FF4D4F。字体使用系统默认字体，字号层级清晰。', '产品', 0, NOW(), NOW()),
('doc-010', '客户满意度调查报告', '本次调查共回收有效问卷1500份，整体满意度85%。主要问题集中在客服响应速度和产品稳定性。改进措施：增加客服人员、优化系统架构、建立快速响应机制。', '市场', 0, NOW(), NOW()),
('doc-011', 'Spring Boot微服务架构实践', '微服务架构设计原则：单一职责、独立部署、容错设计、数据隔离。技术选型：Spring Boot + Spring Cloud + Nacos + Sentinel。服务拆分粒度建议以业务域为边界。', '技术', 0, NOW(), NOW()),
('doc-012', '2024年营销策略规划', '营销策略：内容营销、社交营销、KOL合作、SEO优化。预算分配：线上60%，线下40%。重点关注用户留存和复购，预计ROI达到5:1。', '市场', 0, NOW(), NOW());
