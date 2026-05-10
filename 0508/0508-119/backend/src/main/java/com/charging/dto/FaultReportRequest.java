package com.charging.dto;

import lombok.Data;

@Data
public class FaultReportRequest {
    private String pileCode;
    private Long pileId;
    private String description;
    private String photoUrl;
}
