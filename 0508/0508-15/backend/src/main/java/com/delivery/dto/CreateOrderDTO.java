package com.delivery.dto;

import lombok.Data;

@Data
public class CreateOrderDTO {

    private String orderId;
    private Double merchantLng;
    private Double merchantLat;
    private Double userLng;
    private Double userLat;
    private Integer expectedMinutes;
}
