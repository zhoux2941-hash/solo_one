package com.carpool.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Entity
@Table(name = "trips", indexes = {
    @Index(name = "idx_destination_time", columnList = "destinationCity, departureTime"),
    @Index(name = "idx_destination", columnList = "destinationCity"),
    @Index(name = "idx_status", columnList = "status")
})
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "publisher_id", nullable = false)
    private User publisher;

    @Column(nullable = false)
    private String departureCity;

    @Column(nullable = false)
    private String destinationCity;

    @Column(length = 500)
    private String waypoints;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Transient
    private String matchType;

    public List<String> getWaypointList() {
        if (waypoints == null || waypoints.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(waypoints.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
    }

    public boolean hasWaypoint(String city) {
        if (city == null || city.trim().isEmpty()) {
            return false;
        }
        String normalizedCity = city.trim();
        return getWaypointList().stream()
            .anyMatch(w -> w.equalsIgnoreCase(normalizedCity));
    }

    @Column(nullable = false)
    private Integer totalSeats;

    @Column(nullable = false)
    private Integer availableSeats;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal costPerPerson;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private String status = "OPEN";

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (availableSeats == null) {
            availableSeats = totalSeats;
        }
    }
}
