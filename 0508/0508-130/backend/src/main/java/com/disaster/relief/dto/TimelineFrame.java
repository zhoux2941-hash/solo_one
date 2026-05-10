package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TimelineFrame {
    private Integer day;
    private Integer tentRemaining;
    private Integer waterRemaining;
    private Integer foodRemaining;
    private Integer medicalKitRemaining;
    private Integer tentConsumed;
    private Integer waterConsumed;
    private Integer foodConsumed;
    private Integer medicalKitConsumed;
    private Integer tentDelivered;
    private Integer waterDelivered;
    private Integer foodDelivered;
    private Integer medicalKitDelivered;
    private String status;
    private String message;
}
