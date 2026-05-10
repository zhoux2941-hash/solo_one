package com.meteor.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SpectraResponse {
    private Long id;
    private String originalFilename;
    private String thumbnailUrl;
    private Double minWavelength;
    private Double maxWavelength;
    private Double velocity;
    private String notes;
    private String uploaderName;
    private LocalDateTime uploadTime;
    private Long viewCount;
    private List<String> detectedElements;
}
