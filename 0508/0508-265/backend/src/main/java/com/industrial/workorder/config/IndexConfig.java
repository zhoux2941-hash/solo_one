package com.industrial.workorder.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class IndexConfig implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(IndexConfig.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        createWorkOrderIndexes();
    }

    private void createWorkOrderIndexes() {
        try {
            createIndexIfNotExists("idx_work_order_create_time", 
                "CREATE INDEX idx_work_order_create_time ON work_order(create_time)");
            
            createIndexIfNotExists("idx_work_order_status", 
                "CREATE INDEX idx_work_order_status ON work_order(status)");
            
            createIndexIfNotExists("idx_work_order_assignee", 
                "CREATE INDEX idx_work_order_assignee ON work_order(assignee_id)");
            
            createIndexIfNotExists("idx_work_order_device", 
                "CREATE INDEX idx_work_order_device ON work_order(device_id)");
            
            createIndexIfNotExists("idx_work_order_fault_type", 
                "CREATE INDEX idx_work_order_fault_type ON work_order(fault_type)");
            
            createIndexIfNotExists("idx_work_order_priority", 
                "CREATE INDEX idx_work_order_priority ON work_order(priority)");
            
            createIndexIfNotExists("idx_work_order_date_status", 
                "CREATE INDEX idx_work_order_date_status ON work_order(create_time, status)");
            
            createIndexIfNotExists("idx_work_order_date_assignee", 
                "CREATE INDEX idx_work_order_date_assignee ON work_order(create_time, assignee_id)");
            
            logger.info("WorkOrder indexes created successfully");
        } catch (Exception e) {
            logger.warn("WorkOrder indexes may already exist: {}", e.getMessage());
        }
    }

    private void createIndexIfNotExists(String indexName, String sql) {
        try {
            jdbcTemplate.execute(sql);
            logger.info("Created index: {}", indexName);
        } catch (Exception e) {
            logger.debug("Index {} may already exist: {}", indexName, e.getMessage());
        }
    }
}
