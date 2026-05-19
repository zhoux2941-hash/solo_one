package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GazeRecord {
    private String visitorId;
    private String exhibitId;
    private long timestamp;
    private double gazeDirectionX;
    private double gazeDirectionY;
    private double gazeConfidence;
    private double gazeDuration;
    private boolean isLookingAtExhibit;
    private String cameraId;
}
