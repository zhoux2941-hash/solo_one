package com.meteor.dto;

import lombok.Data;

@Data
public class EmissionLineResponse {
    private Long id;
    private String element;
    private Double wavelength;
    private Double intensity;
    private Boolean isAutoDetected;
    private String notes;
}
