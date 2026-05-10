package com.quiz.dto;

import lombok.Data;

@Data
public class SubmitAnswerRequest {
    private Long competitionId;
    private Long teamId;
    private String answer;
}
