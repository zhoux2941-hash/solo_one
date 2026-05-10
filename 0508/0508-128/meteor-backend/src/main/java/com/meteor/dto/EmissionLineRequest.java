package com.meteor.dto;

import lombok.Data;

@Data
public class EmissionLineRequest {
    private String element;
    private Double wavelength;
    private Double intensity;
    private Boolean isAutoDetected;
    private String notes;
}
