package com.astro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuideStarResponse {
    private boolean success;
    private String message;
    private GuideStarAnalysis analysis;
    private List<GuideStarDataPoint> errorCurve;
    private List<CorrectionSuggestion> suggestions;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class GuideStarAnalysis {
    private String guideStarName;
    private Double guideStarRa;
    private Double guideStarDec;
    private Double targetRa;
    private Double targetDec;
    private Double separation;
    private Double guideStarElevation;
    private Double targetElevation;
    private Double avgRmsError;
    private Double maxError;
    private String quality;
    private String guidingMode;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuideStarDataPoint {
    private Integer frame;
    private Double raError;
    private Double decError;
    private Double totalError;
    private Long timestamp;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CorrectionSuggestion {
    private String type;
    private String priority;
    private String title;
    private String description;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuideStarCatalog {
    private String name;
    private Double ra;
    private Double dec;
    private Double magnitude;
    private String constellation;
}
