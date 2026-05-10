package com.example.chemical.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long applicationId;
    private boolean approved;
    private String comment;
}
