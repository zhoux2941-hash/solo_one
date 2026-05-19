package com.museum.analysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Camera {
    private String id;
    private String name;
    private double x;
    private double y;
    private double fov;
    private double direction;
    private boolean active;
}
