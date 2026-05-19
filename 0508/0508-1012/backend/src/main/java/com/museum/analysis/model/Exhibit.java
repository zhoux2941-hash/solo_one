package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exhibit {
    private String id;
    private String name;
    private String category;
    private String description;
    private double x;
    private double y;
    private int zone;
}
