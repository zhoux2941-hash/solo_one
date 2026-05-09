package com.gym.sanitization.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SanitizationRequest {
    private Long equipmentId;
    private String photoBase64;
    private String inspectorName;
}
