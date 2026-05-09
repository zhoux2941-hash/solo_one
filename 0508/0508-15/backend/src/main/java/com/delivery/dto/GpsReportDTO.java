package com.delivery.dto;

import lombok.Data;

@Data
public class GpsReportDTO {

    private String riderId;
    private String orderId;
    private Double lng;
    private Double lat;
}
