package com.tide.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "moon_phases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoonPhase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Double phase;

    @Column(nullable = false, length = 50)
    private String phaseName;

    @Column(nullable = false)
    private Double illumination;

    @Column(name = "moonrise_time")
    private java.time.LocalTime moonriseTime;

    @Column(name = "moonset_time")
    private java.time.LocalTime moonsetTime;

    @Column(name = "meridian_time")
    private java.time.LocalTime meridianTime;

    @Column(name = "moon_distance")
    private Double moonDistance;

    @Column(name = "moon_distance_km")
    private Double moonDistanceKm;

    @Column(name = "is_perigee")
    private Boolean isPerigee;

    @Column(name = "is_apogee")
    private Boolean isApogee;

    @Column(name = "is_spring_tide")
    private Boolean isSpringTide;

    @Column(name = "is_astronomical_spring_tide")
    private Boolean isAstronomicalSpringTide;

    @Column(name = "tide_intensity")
    private String tideIntensity;

    @Column(length = 200)
    private String description;
}
