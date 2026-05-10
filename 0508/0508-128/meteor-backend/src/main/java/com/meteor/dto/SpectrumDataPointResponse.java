package com.meteor.dto;

import lombok.Data;

@Data
public class SpectrumDataPointResponse {
    private Double wavelength;
    private Double intensity;
    private Integer pixelIndex;
}
