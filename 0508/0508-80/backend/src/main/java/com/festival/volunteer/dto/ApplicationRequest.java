package com.festival.volunteer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationRequest {
    @NotNull
    private Long positionId;
    private String preferredTime;
    private String notes;
}
