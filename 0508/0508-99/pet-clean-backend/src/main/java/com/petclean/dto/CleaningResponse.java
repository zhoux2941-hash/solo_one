package com.petclean.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CleaningResponse {

    private Long recordId;
    private Long cleaningPointId;
    private boolean pointsAwarded;
    private Integer pointsEarned;
    private String message;
}
