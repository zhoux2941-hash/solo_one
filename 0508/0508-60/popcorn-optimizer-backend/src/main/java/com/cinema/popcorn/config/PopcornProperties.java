package com.cinema.popcorn.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.popcorn")
public class PopcornProperties {
    private int totalMachines = 3;
    private int warmupMinutes = 15;
    private int peakStartHour = 19;
    private int peakEndHour = 21;
    private int maxQueueLength = 10;
    private int serviceRatePerMachine = 30;
    
    private double warmupPowerKw = 2.0;
    private double runningPowerKw = 1.5;
    private double electricityPricePerKwh = 0.8;
}
