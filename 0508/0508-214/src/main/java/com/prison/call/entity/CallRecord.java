package com.prison.call.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "call_records")
public class CallRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long inmateId;

    private String inmateName;

    private String inmateNo;

    private String prisonArea;

    private String calledNumber;

    private String calledPerson;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer durationSeconds;

    @Lob
    private String transcription;

    private Boolean hasSensitiveWord = false;

    private String sensitiveWordsFound;

    private String status;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
