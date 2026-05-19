package com.kindergarten.temperature.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "temperature_record")
public class TemperatureRecord implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bed_no", nullable = false)
    private Integer bedNo;

    @Column(name = "temperature", nullable = false, precision = 4, scale = 1)
    private Double temperature;

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime;

    @Column(name = "is_abnormal", nullable = false)
    private Boolean abnormal;

    @Column(name = "abnormal_type", length = 50)
    private String abnormalType;

    @Column(name = "abnormal_message", length = 200)
    private String abnormalMessage;
}
