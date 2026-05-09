package com.logistics.track.dto;

import lombok.Data;

@Data
public class SuspectedStuckNode {
    private String centerName;
    private String location;
    private Double latitude;
    private Double longitude;
    private Long stuckHours;
    private String status;
    private Double probability;
}
