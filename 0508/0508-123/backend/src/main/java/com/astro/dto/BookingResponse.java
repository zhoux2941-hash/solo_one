package com.astro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private boolean success;
    private String message;
    private Long bookingId;
    private Double elevation;
}
