package com.astronomy.spectral.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StarTypeInfo {
    private double minTemp;
    private double maxTemp;
    private String color;
    private String colorName;
    private String description;
    private List<SpectralLine> lines;
}
