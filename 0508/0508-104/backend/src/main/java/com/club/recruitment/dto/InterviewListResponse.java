package com.club.recruitment.dto;

import lombok.Data;

@Data
public class InterviewListResponse {
    private Long applicantId;
    private String name;
    private String studentId;
    private String assignedDepartmentName;
    private String assignedSlot;
    private Integer priority;
    private Boolean acceptAdjustment;
}