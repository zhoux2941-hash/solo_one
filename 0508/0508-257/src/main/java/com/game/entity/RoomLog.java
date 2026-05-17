package com.game.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_logs")
public class RoomLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roomId;

    private String roomNumber;

    private String roomName;

    private Long playerId;

    private String playerName;

    @Enumerated(EnumType.STRING)
    private LogType logType;

    private String description;

    private LocalDateTime createTime;

    public enum LogType {
        ROOM_CREATED("房间创建"),
        ROOM_DISBANDED("房间解散"),
        PLAYER_JOINED("玩家加入"),
        PLAYER_LEFT("玩家离开"),
        GAME_STARTED("游戏开始"),
        GAME_ENDED("游戏结束"),
        OWNER_CHANGED("房主变更"),
        MATCHING_STARTED("开始匹配"),
        MATCHING_SUCCESS("匹配成功"),
        MATCHING_FAILED("匹配失败");

        private final String displayName;

        LogType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }

    public RoomLog() {
    }

    public RoomLog(Long roomId, String roomNumber, String roomName, Long playerId, String playerName, LogType logType, String description) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomName = roomName;
        this.playerId = playerId;
        this.playerName = playerName;
        this.logType = logType;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public Long getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public LogType getLogType() {
        return logType;
    }

    public void setLogType(LogType logType) {
        this.logType = logType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}