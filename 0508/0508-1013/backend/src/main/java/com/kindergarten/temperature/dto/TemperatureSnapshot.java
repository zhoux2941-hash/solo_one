package com.kindergarten.temperature.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemperatureSnapshot implements Serializable {

    private Integer bedNo;
    private String childName;
    private Double currentTemperature;
    private Double lastTemperature;
    private LocalDateTime recordTime;
    private Boolean abnormal;
    private String abnormalType;
    private String abnormalMessage;
}
