package com.game.social.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_welfares")
public class TeamWelfare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long teamId;

    private String welfareName;

    private String welfareType;

    @Column(length = 1000)
    private String description;

    private String reward;

    private Boolean enabled;

    private LocalDateTime createTime;

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

    public String getWelfareName() {
        return welfareName;
    }

    public void setWelfareName(String welfareName) {
        this.welfareName = welfareName;
    }

    public String getWelfareType() {
        return welfareType;
    }

    public void setWelfareType(String welfareType) {
        this.welfareType = welfareType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReward() {
        return reward;
    }

    public void setReward(String reward) {
        this.reward = reward;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
