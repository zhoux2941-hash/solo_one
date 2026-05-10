package com.example.trashbin.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EcoStarDTO {
    private Long residentId;
    private String roomNumber;
    private String name;
    private Integer totalPoints;
    private Integer year;
    private Integer month;
    private String title;
}
