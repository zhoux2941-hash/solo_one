-- 创建数据库
CREATE DATABASE IF NOT EXISTS crew_notice DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE crew_notice;

-- 用户表（JPA会自动创建，但这里提供参考）
-- CREATE TABLE IF NOT EXISTS users (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     name VARCHAR(100) NOT NULL,
--     role VARCHAR(50) NOT NULL
-- );

-- 通告表
-- CREATE TABLE IF NOT EXISTS notices (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     notice_date DATE NOT NULL,
--     scene_name VARCHAR(255) NOT NULL,
--     start_time TIME NOT NULL,
--     end_time TIME NOT NULL,
--     costume_requirement TEXT,
--     prop_requirement TEXT,
--     materials_ready BOOLEAN DEFAULT FALSE,
--     director_id BIGINT NOT NULL,
--     FOREIGN KEY (director_id) REFERENCES users(id)
-- );

-- 通告-演员关联表
-- CREATE TABLE IF NOT EXISTS notice_actors (
--     notice_id BIGINT NOT NULL,
--     actor_id BIGINT NOT NULL,
--     PRIMARY KEY (notice_id, actor_id),
--     FOREIGN KEY (notice_id) REFERENCES notices(id),
--     FOREIGN KEY (actor_id) REFERENCES users(id)
-- );

-- 注意：由于使用了JPA的ddl-auto=update，表结构会自动创建
-- 您只需要确保MySQL数据库已创建即可
