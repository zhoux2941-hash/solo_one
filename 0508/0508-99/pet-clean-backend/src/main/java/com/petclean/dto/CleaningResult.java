package com.petclean.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CleaningResult {

    private Long cleaningPointId;
    private boolean shouldAwardPoints;
    private String message;
}
