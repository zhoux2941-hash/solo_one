package com.hospital.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "beds")
public class Bed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String bedNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BedType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BedStatus status;

    private String patientName;
    private String patientId;

    public enum BedType {
        NORMAL, ICU
    }

    public enum BedStatus {
        AVAILABLE, OCCUPIED
    }
}
