CREATE DATABASE IF NOT EXISTS grafting_assistant DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE grafting_assistant;

CREATE TABLE IF NOT EXISTS plants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(150),
    type ENUM('ROOTSTOCK', 'SCION', 'BOTH') NOT NULL DEFAULT 'BOTH',
    family VARCHAR(100),
    genus VARCHAR(100),
    species VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grafting_compatibility (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rootstock_id BIGINT NOT NULL,
    scion_id BIGINT NOT NULL,
    initial_score INT NOT NULL DEFAULT 50,
    physiological_relation VARCHAR(20) NOT NULL COMMENT 'FAMILY: 同科, GENUS: 同属, SPECIES: 同种, UNRELATED: 无亲缘',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rootstock_scion (rootstock_id, scion_id),
    FOREIGN KEY (rootstock_id) REFERENCES plants(id),
    FOREIGN KEY (scion_id) REFERENCES plants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grafting_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rootstock_id BIGINT NOT NULL,
    scion_id BIGINT NOT NULL,
    grafting_date DATE NOT NULL,
    method ENUM('SPLICE', 'BUDDING', 'WEDGE', 'APPROACH') NOT NULL DEFAULT 'SPLICE' COMMENT 'SPLICE: 劈接, BUDDING: 芽接, WEDGE: 楔接, APPROACH: 靠接',
    total_count INT NOT NULL DEFAULT 1,
    survival_count INT DEFAULT NULL,
    survival_rate DECIMAL(5,2) DEFAULT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rootstock_scion (rootstock_id, scion_id),
    INDEX idx_grafting_date (grafting_date),
    FOREIGN KEY (rootstock_id) REFERENCES plants(id),
    FOREIGN KEY (scion_id) REFERENCES plants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS compatibility_scores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rootstock_id BIGINT NOT NULL,
    scion_id BIGINT NOT NULL,
    bayesian_score INT NOT NULL DEFAULT 50,
    total_records INT NOT NULL DEFAULT 0,
    total_survival_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    average_survival_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rootstock_scion (rootstock_id, scion_id),
    FOREIGN KEY (rootstock_id) REFERENCES plants(id),
    FOREIGN KEY (scion_id) REFERENCES plants(id),
    INDEX idx_bayesian_score (bayesian_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO plants (name, scientific_name, type, family, genus, species, description) VALUES 
('野蔷薇', 'Rosa multiflora', 'ROOTSTOCK', '蔷薇科', '蔷薇属', '野蔷薇', '常用月季砧木，适应性强'),
('月季', 'Rosa chinensis', 'SCION', '蔷薇科', '蔷薇属', '月季', '观赏花卉，常用接穗'),
('玫瑰', 'Rosa rugosa', 'BOTH', '蔷薇科', '蔷薇属', '玫瑰', '可作砧木或接穗'),
('柑橘', 'Citrus reticulata', 'BOTH', '芸香科', '柑橘属', '柑橘', '柑橘类果树'),
('枳壳', 'Poncirus trifoliata', 'ROOTSTOCK', '芸香科', '枳属', '枳', '柑橘类常用砧木'),
('桃', 'Prunus persica', 'BOTH', '蔷薇科', '李属', '桃', '核果类果树'),
('山桃', 'Prunus davidiana', 'ROOTSTOCK', '蔷薇科', '李属', '山桃', '桃树常用砧木'),
('杏', 'Prunus armeniaca', 'BOTH', '蔷薇科', '李属', '杏', '核果类果树'),
('苹果', 'Malus domestica', 'BOTH', '蔷薇科', '苹果属', '苹果', '仁果类果树'),
('海棠', 'Malus spectabilis', 'ROOTSTOCK', '蔷薇科', '苹果属', '海棠', '苹果常用砧木');

INSERT INTO grafting_compatibility (rootstock_id, scion_id, initial_score, physiological_relation, notes) VALUES 
(1, 2, 90, 'GENUS', '野蔷薇作为月季砧木亲和度极高'),
(1, 3, 85, 'GENUS', '野蔷薇与玫瑰同属亲和度高'),
(5, 4, 88, 'FAMILY', '枳壳与柑橘同科亲和度高'),
(7, 6, 85, 'GENUS', '山桃与桃树同属亲和度高'),
(7, 8, 75, 'GENUS', '山桃与杏树同属亲和度较好'),
(10, 9, 90, 'GENUS', '海棠与苹果同属亲和度极高'),
(3, 2, 80, 'GENUS', '玫瑰与月季同属亲和度较好');
