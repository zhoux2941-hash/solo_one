package com.disaster.relief.dto;

import lombok.Data;

@Data
public class ReliefPoint {
    private String id;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer affectedPopulation;
    private Double priority = 1.0;
}
