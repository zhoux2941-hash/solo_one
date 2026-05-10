package com.festival.volunteer.dto;

import lombok.Data;

@Data
public class HeatMapStats {
    private String date;
    private String timeSlot;
    private String positionName;
    private Integer count;
    private Integer required;

    public HeatMapStats(String date, String timeSlot, String positionName, Integer count, Integer required) {
        this.date = date;
        this.timeSlot = timeSlot;
        this.positionName = positionName;
        this.count = count;
        this.required = required;
    }
}
