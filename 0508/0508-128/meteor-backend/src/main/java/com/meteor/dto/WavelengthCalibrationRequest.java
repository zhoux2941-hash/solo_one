package com.meteor.dto;

import lombok.Data;

@Data
public class WavelengthCalibrationRequest {
    private Double minWavelength;
    private Double maxWavelength;
    private Integer startPixelX;
    private Integer startPixelY;
    private Integer endPixelX;
    private Integer endPixelY;
}
