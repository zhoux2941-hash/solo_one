package com.crew.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConflictInfo {
    private Long actorId;
    private String actorName;
    private String conflictScene;
    private LocalTime conflictStartTime;
    private LocalTime conflictEndTime;
}