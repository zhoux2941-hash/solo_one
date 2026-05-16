package com.health.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String idCard;

    @Column(nullable = false)
    private Long packageId;

    @Column(nullable = false)
    private String packageName;

    @Column(nullable = false)
    private LocalDate reservationDate;

    @Column(nullable = false)
    private String timeSlot;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private String smsMessage;

    private Boolean reportUploaded;
}
