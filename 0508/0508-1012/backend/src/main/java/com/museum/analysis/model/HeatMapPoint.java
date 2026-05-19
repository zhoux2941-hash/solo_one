package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeatMapPoint {
    private double x;
    private double y;
    private int value;
    private String exhibitId;
    private String exhibitName;
}
