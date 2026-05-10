package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TimelineEvent {
    private Integer day;
    private String type;
    private String supplyType;
    private Integer amount;
    private String description;
    private String level;
}
