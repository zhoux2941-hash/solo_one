package com.gym.sanitization.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanitizationAlertDTO {
    private Long equipmentId;
    private String equipmentName;
    private String equipmentCategory;
    private Integer sanitizationIntervalHours;
    private LocalDateTime lastSanitizationTime;
    private Long overdueHours;
    private String status;
    private LocalDateTime alertTime;
}
