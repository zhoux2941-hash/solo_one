package com.pest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "report")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;

    @Column(nullable = false, length = 50)
    private String cropType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double area;

    @ElementCollection
    @CollectionTable(name = "report_images", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "image_path")
    private List<String> images;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "expert_id")
    private Long expertId;

    @Column(name = "diagnosis_text", columnDefinition = "TEXT")
    private String diagnosisText;

    @Column(name = "pest_name", length = 100)
    private String pestName;

    @Column(name = "medicine_suggestion", columnDefinition = "TEXT")
    private String medicineSuggestion;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    private Evaluation evaluation;

    @Column(name = "report_time", nullable = false, updatable = false)
    private LocalDateTime reportTime = LocalDateTime.now();

    @Column(name = "diagnosis_time")
    private LocalDateTime diagnosisTime;

    @Column(name = "evaluation_time")
    private LocalDateTime evaluationTime;

    public enum Status {
        PENDING, DIAGNOSED, EVALUATED
    }

    public enum Severity {
        LIGHT, MEDIUM, SEVERE
    }

    public enum Evaluation {
        SATISFIED, UNSATISFIED
    }
}