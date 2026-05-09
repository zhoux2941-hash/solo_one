package com.carwash.monitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapDataDTO {

    private List<String> hours;

    private List<String> machines;

    private List<HeatmapCell> data;

    private String cacheTime;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatmapCell {
        private int hour;
        private int machineIndex;
        private String machineId;
        private double concentration;
        private int deviationLevel;
        private String status;
    }
}
