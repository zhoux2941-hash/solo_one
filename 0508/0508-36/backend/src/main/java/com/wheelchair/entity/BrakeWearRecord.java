package com.wheelchair.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "brake_wear_record", indexes = {
    @Index(name = "idx_wheelchair_date", columnList = "wheelchairId, recordDate")
})
public class BrakeWearRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String wheelchairId;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(nullable = false)
    private Integer wearValue;
}
