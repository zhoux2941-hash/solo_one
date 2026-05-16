package com.quiz.entity;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class Team {
    private String id;
    private String name;
    private Integer score;
    private List<TeamMember> members;

    public Team() {
        this.score = 0;
        this.members = new ArrayList<>();
    }

    public Team(String id, String name) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.members = new ArrayList<>();
    }

    public void addMember(TeamMember member) {
        this.members.add(member);
    }
}
