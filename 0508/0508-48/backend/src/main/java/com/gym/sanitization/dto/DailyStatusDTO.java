package com.gym.sanitization.dto;

import com.gym.sanitization.entity.Equipment;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyStatusDTO {
    private Equipment equipment;
    private boolean sanitized;
    private LocalDateTime lastSanitizationTime;
    private String lastPhotoBase64;
    private String lastInspectorName;
}
