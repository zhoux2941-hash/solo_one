package com.quiz.entity;

import lombok.Data;

@Data
public class Answer {
    private String memberId;
    private String memberName;
    private String teamId;
    private String questionId;
    private String answer;
    private Long responseTime;
    private Boolean isCorrect;
}
