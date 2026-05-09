package com.gym.sanitization.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchSanitizationRequest {
    private List<Long> equipmentIds;
    private String inspectorName;
    private String photoBase64;
}
