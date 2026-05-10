package com.example.trashbin.dto;

import lombok.Data;

@Data
public class RankDTO {
    private Long residentId;
    private String roomNumber;
    private String name;
    private Integer totalPoints;
    private Integer rank;
}
