package com.meteor.dto;

import lombok.Data;

@Data
public class VelocityEstimateRequest {
    
    private Double pixelDistance;
    
    private Integer startPixelX;
    private Integer startPixelY;
    private Integer endPixelX;
    private Integer endPixelY;
    
    private Integer imageWidth;
    private Integer imageHeight;
    
    private Double fieldOfViewDegrees;
    
    private Integer frames;
    private Double fps;
    
    private Double meteorHeightKm;
}
