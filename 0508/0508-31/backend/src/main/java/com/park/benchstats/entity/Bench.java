package com.park.benchstats.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "bench")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bench {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bench_code", unique = true, nullable = false, length = 50)
    private String benchCode;

    @Column(name = "bench_name", nullable = false, length = 100)
    private String benchName;

    @Column(name = "area", nullable = false, length = 20)
    private String area;

    @Column(name = "orientation", nullable = false, length = 50)
    private String orientation;
}
