package com.office.plantreminder.dto;

import lombok.Data;

@Data
public class WateringRequest {
    private Long plantId;
    private String wateredBy;
    private String notes;
}
