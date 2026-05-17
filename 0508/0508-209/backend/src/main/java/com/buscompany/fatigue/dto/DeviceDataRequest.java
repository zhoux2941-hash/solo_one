package com.buscompany.fatigue.dto;

import lombok.Data;

@Data
public class DeviceDataRequest {
    private String driverNo;
    private String busNo;
    private Boolean yawning;
    private Boolean eyeClosed;
    private Boolean distracted;
    private Double eyeAspectRatio;
    private Integer mouthOpenness;
}
