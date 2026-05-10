package com.meteor.dto;

import lombok.Data;

@Data
public class SpectraDetailResponse {
    private Long id;
    private String originalFilename;
    private String imageUrl;
    private String thumbnailUrl;
    private Double minWavelength;
    private Double maxWavelength;
    private Integer startPixelX;
    private Integer startPixelY;
    private Integer endPixelX;
    private Integer endPixelY;
    private Double velocity;
    private String notes;
    private String uploaderName;
    private String uploadTime;
    private Long viewCount;
    private java.util.List<EmissionLineResponse> emissionLines;
    private java.util.List<SpectrumDataPointResponse> spectrumData;
}
