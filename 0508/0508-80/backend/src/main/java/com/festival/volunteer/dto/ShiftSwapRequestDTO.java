package com.festival.volunteer.dto;

import lombok.Data;

@Data
public class ShiftSwapRequestDTO {
    private Long scheduleId;
    private Long toVolunteerId;
    private String reason;
}
