package com.meteor.entity;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "constellations")
public class Constellation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String chineseName;

    private String abbreviation;

    @Column(name = "center_ra")
    private Double centerRA;

    @Column(name = "center_dec")
    private Double centerDec;

    @Column(name = "boundary_min_ra")
    private Double boundaryMinRA;

    @Column(name = "boundary_max_ra")
    private Double boundaryMaxRA;

    @Column(name = "boundary_min_dec")
    private Double boundaryMinDec;

    @Column(name = "boundary_max_dec")
    private Double boundaryMaxDec;

    @Column(name = "display_order")
    private Integer displayOrder;
}
