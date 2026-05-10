package com.beekeeper.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class ComparisonDataDTO {
    private List<String> dates;
    private Map<Long, String> hiveNumbers;
    private Map<Long, List<Double>> morningTemperatures;
    private Map<Long, List<Double>> eveningTemperatures;
    private Map<Long, List<Integer>> activityLevels;
}
