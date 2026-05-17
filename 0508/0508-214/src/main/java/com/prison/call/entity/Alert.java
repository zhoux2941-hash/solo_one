package com.prison.call.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long callRecordId;

    private Long inmateId;

    private String inmateName;

    private String prisonArea;

    private String sensitiveWords;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String transcription;

    private String status;

    private String handler;

    private LocalDateTime handledAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = "PENDING";
    }
}
