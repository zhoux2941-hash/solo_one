package com.carwash.monitor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.foam")
public class FoamConfig {
    private Double minNormal = 2.0;
    private Double maxNormal = 5.0;
}
