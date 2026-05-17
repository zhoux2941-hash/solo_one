package com.game.social.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "team_activities")
public class TeamActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long teamId;

    private LocalDate activityDate;

    private Integer activeMembers;

    private Integer totalActivity;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public LocalDate getActivityDate() {
        return activityDate;
    }

    public void setActivityDate(LocalDate activityDate) {
        this.activityDate = activityDate;
    }

    public Integer getActiveMembers() {
        return activeMembers;
    }

    public void setActiveMembers(Integer activeMembers) {
        this.activeMembers = activeMembers;
    }

    public Integer getTotalActivity() {
        return totalActivity;
    }

    public void setTotalActivity(Integer totalActivity) {
        this.totalActivity = totalActivity;
    }
}
