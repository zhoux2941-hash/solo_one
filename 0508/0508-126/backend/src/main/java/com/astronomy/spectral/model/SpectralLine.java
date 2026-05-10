package com.astronomy.spectral.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpectralLine {
    private String name;
    private double wavelength;
    private String element;
    private double depth;
}
