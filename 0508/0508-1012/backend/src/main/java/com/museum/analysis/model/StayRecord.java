package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StayRecord {
    private String visitorId;
    private String exhibitId;
    private long enterTime;
    private long leaveTime;
    private int durationSeconds;
    private double rawX;
    private double rawY;
    private double positioningAccuracy;
    private double confidence;
    private double allocatedDuration;
    private int rssi;
    private double gazeDuration;
    private double gazeRatio;
    private double effectiveDuration;
    private boolean isPassingBy;
    private int gazeSampleCount;
}

