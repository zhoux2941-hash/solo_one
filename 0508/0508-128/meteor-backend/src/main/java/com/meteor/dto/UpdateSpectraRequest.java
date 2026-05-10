package com.meteor.dto;

import lombok.Data;

@Data
public class UpdateSpectraRequest {
    private Double velocity;
    private String notes;
    private String uploaderName;
}
