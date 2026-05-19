package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitorFlow {
    private long timestamp;
    private String timeStr;
    private int enterCount;
    private int leaveCount;
    private int currentVisitorCount;
}
