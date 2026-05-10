package com.astro.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "telescopes")
public class Telescope {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String primaryMirror;

    @Column(nullable = false)
    private String cameraModel;

    @Column(nullable = false)
    private Double fieldOfView;

    @Column(nullable = false)
    private Double limitingMagnitude;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Double minElevation = 15.0;

    private String description;
}
