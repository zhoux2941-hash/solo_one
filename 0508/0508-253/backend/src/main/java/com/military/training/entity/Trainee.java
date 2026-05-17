package com.military.training.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "trainee")
public class Trainee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String employeeId;

    @Column(nullable = false)
    private String name;

    private String gender;

    private Integer age;

    private String platoon;

    private String squad;

    private LocalDate enrollmentDate;

    private String status;
}