package com.logistics.track.dto;

import lombok.Data;

@Data
public class StuckCenterDTO {
    private String centerName;
    private String location;
    private Double latitude;
    private Double longitude;
    private Long stuckCount;
    private Long stuckHours;
}
