package com.express.station.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "station.config")
public class StationConfig {
    private int rows = 3;
    private int columns = 10;
    private double cellCapacity = 0.1;
}
