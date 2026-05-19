package com.kindergarten.temperature.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@Entity
@Table(name = "bed")
public class Bed implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bed_no", unique = true, nullable = false)
    private Integer bedNo;

    @Column(name = "child_name", length = 50)
    private String childName;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender", length = 10)
    private String gender;
}
