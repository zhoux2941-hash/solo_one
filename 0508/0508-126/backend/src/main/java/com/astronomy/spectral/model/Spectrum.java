package com.astronomy.spectral.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Spectrum {
    private String type;
    private double temperature;
    private List<Double> wavelengths;
    private List<Double> intensities;
    private List<SpectralLine> lines;
}
