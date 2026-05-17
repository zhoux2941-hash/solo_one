package com.game.social.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blacklists")
public class Blacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private Long blockedPlayerId;

    private String blockedNickname;

    private String reason;

    private LocalDateTime createTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public Long getBlockedPlayerId() {
        return blockedPlayerId;
    }

    public void setBlockedPlayerId(Long blockedPlayerId) {
        this.blockedPlayerId = blockedPlayerId;
    }

    public String getBlockedNickname() {
        return blockedNickname;
    }

    public void setBlockedNickname(String blockedNickname) {
        this.blockedNickname = blockedNickname;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
