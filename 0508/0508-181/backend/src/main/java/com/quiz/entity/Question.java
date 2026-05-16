package com.quiz.entity;

import lombok.Data;
import java.util.List;

@Data
public class Question {
    private String id;
    private String content;
    private List<String> options;
    private String answer;
    private Integer countdown;
}
