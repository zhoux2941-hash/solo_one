package com.quiz.entity;

import lombok.Data;

@Data
public class TeamMember {
    private String id;
    private String name;
    private String teamId;
    private Integer correctCount;
    private Long totalResponseTime;

    public TeamMember() {
        this.correctCount = 0;
        this.totalResponseTime = 0L;
    }

    public TeamMember(String id, String name, String teamId) {
        this.id = id;
        this.name = name;
        this.teamId = teamId;
        this.correctCount = 0;
        this.totalResponseTime = 0L;
    }
}
