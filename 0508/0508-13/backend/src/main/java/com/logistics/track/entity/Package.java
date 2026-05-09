package com.logistics.track.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Package {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long packageId;

    @Column(nullable = false, unique = true)
    private String packageNo;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false)
    private String senderCity;

    @Column(nullable = false)
    private String receiver;

    @Column(nullable = false)
    private String receiverCity;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TrackStatus currentStatus;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (currentStatus == null) {
            currentStatus = TrackStatus.PICKUP;
        }
    }
}
