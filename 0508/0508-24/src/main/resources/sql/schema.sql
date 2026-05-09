CREATE DATABASE IF NOT EXISTS library_rec DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE library_rec;

DROP TABLE IF EXISTS borrow_record;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS reader;

CREATE TABLE reader (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '读者ID',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='读者表';

CREATE TABLE book (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '书籍ID',
    title VARCHAR(200) NOT NULL COMMENT '书名',
    author VARCHAR(100) COMMENT '作者',
    isbn VARCHAR(20) COMMENT 'ISBN',
    category VARCHAR(50) COMMENT '类别（如：文学、科技、历史等）',
    tags VARCHAR(500) COMMENT '标签，多个用逗号分隔（如：科幻,悬疑,励志）',
    pages INT COMMENT '页数',
    publish_date DATE COMMENT '出版日期',
    description TEXT COMMENT '简介',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='书籍表';

CREATE TABLE borrow_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '借阅记录ID',
    reader_id BIGINT NOT NULL COMMENT '读者ID',
    book_id BIGINT NOT NULL COMMENT '书籍ID',
    borrow_time DATETIME NOT NULL COMMENT '借阅时间',
    due_time DATETIME COMMENT '应还时间（预计读完时间）',
    return_time DATETIME COMMENT '归还时间',
    category VARCHAR(50) COMMENT '书籍类别（冗余字段）',
    tags VARCHAR(500) COMMENT '书籍标签（冗余字段）',
    pages INT COMMENT '书籍页数（冗余字段）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_reader_time (reader_id, borrow_time),
    INDEX idx_book_id (book_id),
    INDEX idx_borrow_time (borrow_time),
    CONSTRAINT fk_borrow_reader FOREIGN KEY (reader_id) REFERENCES reader(id),
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES book(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='借阅记录表';
