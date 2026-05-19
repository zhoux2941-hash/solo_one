package com.museum.analysis.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DataSimulationScheduler {

    private final MuseumDataService dataService;

    public DataSimulationScheduler(MuseumDataService dataService) {
        this.dataService = dataService;
    }

    @Scheduled(fixedRate = 60000)
    public void simulateInfraredCount() {
        dataService.simulateInfraredCount();
    }

    @Scheduled(fixedRate = 5000)
    public void simulateWifiProbe() {
        dataService.simulateWifiProbe();
    }
}
