package com.kindergarten.dashboard.config;

import com.kindergarten.dashboard.model.MaterialType;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "material.threshold")
public class MaterialThresholdConfig {

    private Map<MaterialType, Double> values = new HashMap<>();

    public double getThreshold(MaterialType type) {
        return values.getOrDefault(type, getDefaultThreshold(type));
    }

    private double getDefaultThreshold(MaterialType type) {
        return switch (type) {
            case COLOR_PAPER -> 100.0;
            case GLUE -> 30.0;
            case GLITTER -> 50.0;
            case PIPE_CLEANER -> 80.0;
        };
    }

    public void setThreshold(MaterialType type, double threshold) {
        values.put(type, threshold);
    }
}
