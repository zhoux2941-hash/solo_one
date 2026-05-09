package com.restaurant.queue.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "queue_records", indexes = {
    @Index(name = "idx_restaurant_status", columnList = "restaurantId, status"),
    @Index(name = "idx_restaurant_enqueue", columnList = "restaurantId, enqueueTime")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long queueId;

    @Column(nullable = false)
    private Long restaurantId;

    @Column(nullable = false, length = 20)
    private String phoneNumber;

    @Column(nullable = false)
    private Integer partySize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QueueStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime enqueueTime;

    private LocalDateTime callTime;

    private LocalDateTime completeTime;

    @PrePersist
    protected void onCreate() {
        if (enqueueTime == null) {
            enqueueTime = LocalDateTime.now();
        }
        if (status == null) {
            status = QueueStatus.WAITING;
        }
    }

    public enum QueueStatus {
        WAITING,
        CALLED,
        COMPLETED,
        SKIPPED
    }
}
