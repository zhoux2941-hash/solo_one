package com.bus.scheduling.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.scheduling")
public class SchedulingProperties {
    private Integer initialEnergy = 100;
    private Integer fatigueThreshold = 30;
    private Integer drivingEnergyCostPerHour = 10;
    private Integer restEnergyRecoveryPer30min = 5;
}
