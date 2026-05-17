CREATE TABLE IF NOT EXISTS materials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    capacity INT,
    expiry_date DATE,
    supplier VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS films (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    contact_info VARCHAR(200),
    film_type VARCHAR(100) NOT NULL,
    film_brand VARCHAR(100),
    iso INT,
    rolls INT NOT NULL DEFAULT 1,
    received_date DATE NOT NULL,
    special_requirements TEXT,
    status VARCHAR(50) DEFAULT 'RECEIVED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS process_steps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    film_id BIGINT NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INT,
    temperature DECIMAL(4,2),
    solution_used VARCHAR(100),
    solution_dilution VARCHAR(50),
    agitation VARCHAR(100),
    operator_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (film_id) REFERENCES films(id)
);

CREATE TABLE IF NOT EXISTS finished_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    film_id BIGINT NOT NULL,
    photos_count INT NOT NULL DEFAULT 0,
    negatives_count INT,
    scans_count INT,
    print_size VARCHAR(50),
    delivery_method VARCHAR(50),
    delivery_date DATE,
    delivered_to VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PROCESSING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (film_id) REFERENCES films(id)
);