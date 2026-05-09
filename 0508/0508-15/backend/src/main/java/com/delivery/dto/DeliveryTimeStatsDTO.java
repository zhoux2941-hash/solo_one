package com.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTimeStatsDTO {

    private String timeSlot;
    private List<Long> durations;
    private Long min;
    private Long q1;
    private Long median;
    private Long q3;
    private Long max;
}
