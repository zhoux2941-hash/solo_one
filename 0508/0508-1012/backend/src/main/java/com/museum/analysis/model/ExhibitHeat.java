package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExhibitHeat {
    private String exhibitId;
    private String exhibitName;
    private int visitorCount;
    private double avgStayDuration;
    private int totalStayDuration;
    private boolean isHot;
    private int rank;
}
