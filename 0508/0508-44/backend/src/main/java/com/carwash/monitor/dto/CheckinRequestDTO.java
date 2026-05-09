package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class CheckinRequestDTO {
    private String employeeNo;
    private String imageBase64;
    private String fileName;
}
