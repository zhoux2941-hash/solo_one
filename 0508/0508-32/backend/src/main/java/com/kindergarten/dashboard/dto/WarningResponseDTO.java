package com.kindergarten.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarningResponseDTO {
    private boolean hasWarning;
    private int warningCount;
    private LocalDateTime generatedAt;
    private boolean fromCache;
    private List<MaterialWarningDTO> warnings;
}
