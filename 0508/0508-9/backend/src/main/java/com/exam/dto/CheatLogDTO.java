package com.exam.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CheatLogDTO {
    private Long id;
    private Long userId;
    private Long examId;
    private Long questionId;
    private String actionType;
    private String actionDetail;
    private LocalDateTime timestamp;
    
    private String userName;
    private String questionNumber;
}
