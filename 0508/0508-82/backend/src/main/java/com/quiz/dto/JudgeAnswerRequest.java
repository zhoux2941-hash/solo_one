package com.quiz.dto;

import lombok.Data;

@Data
public class JudgeAnswerRequest {
    private Long competitionId;
    private Long teamId;
    private Boolean isCorrect;
    private Integer points;
}
