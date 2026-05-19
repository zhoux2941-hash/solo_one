package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WifiProbe {
    private String id;
    private double x;
    private double y;
    private double txPower;
    private double environmentalFactor;
}
