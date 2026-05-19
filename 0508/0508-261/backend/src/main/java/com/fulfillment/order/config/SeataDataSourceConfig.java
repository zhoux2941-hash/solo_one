package com.fulfillment.order.config;

import com.zaxxer.hikari.HikariDataSource;
import io.seata.rm.datasource.DataSourceProxy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Slf4j
@Configuration
public class SeataDataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource hikariDataSource() {
        return new HikariDataSource();
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSource hikariDataSource) {
        try {
            log.info("尝试初始化 Seata 数据源代理");
            DataSourceProxy proxy = new DataSourceProxy(hikariDataSource);
            log.info("Seata 数据源代理初始化成功");
            return proxy;
        } catch (Exception e) {
            log.warn("Seata 数据源代理初始化失败，使用默认数据源: {}", e.getMessage());
            return hikariDataSource;
        }
    }
}
