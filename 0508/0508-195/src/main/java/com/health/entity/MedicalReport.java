package com.health.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "medical_reports")
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reservationId;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private String phone;

    private String pdfUrl;

    private String fileType;

    private String fileName;

    @Column(length = 2000)
    private String doctorNotes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "report_id")
    private List<HealthIndicator> indicators = new ArrayList<>();

    private Boolean hasAbnormal;
}
