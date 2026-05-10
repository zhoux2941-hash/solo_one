package com.charging.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationRequest {
    private Long pileId;
    private LocalDateTime startTime;
}
