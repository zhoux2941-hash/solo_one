package com.game.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String roomNumber;

    private String roomName;

    private Long ownerId;

    private String ownerName;

    @Enumerated(EnumType.STRING)
    private RoomType roomType;

    @Enumerated(EnumType.STRING)
    private RoomStatus status;

    @Enumerated(EnumType.STRING)
    private GameMode gameMode;

    @Enumerated(EnumType.STRING)
    private Rank minRank;

    @Enumerated(EnumType.STRING)
    private Rank maxRank;

    private String password;

    private int maxPlayers;

    private int currentPlayers;

    @ElementCollection
    private List<Long> team1Players = new ArrayList<>();

    @ElementCollection
    private List<Long> team2Players = new ArrayList<>();

    private LocalDateTime createTime;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        currentPlayers = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    public Room() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public GameMode getGameMode() {
        return gameMode;
    }

    public void setGameMode(GameMode gameMode) {
        this.gameMode = gameMode;
        this.maxPlayers = gameMode.getMaxPlayers();
    }

    public Rank getMinRank() {
        return minRank;
    }

    public void setMinRank(Rank minRank) {
        this.minRank = minRank;
    }

    public Rank getMaxRank() {
        return maxRank;
    }

    public void setMaxRank(Rank maxRank) {
        this.maxRank = maxRank;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public int getCurrentPlayers() {
        return currentPlayers;
    }

    public void setCurrentPlayers(int currentPlayers) {
        this.currentPlayers = currentPlayers;
    }

    public List<Long> getTeam1Players() {
        return team1Players;
    }

    public void setTeam1Players(List<Long> team1Players) {
        this.team1Players = team1Players;
    }

    public List<Long> getTeam2Players() {
        return team2Players;
    }

    public void setTeam2Players(List<Long> team2Players) {
        this.team2Players = team2Players;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

    public boolean isFull() {
        return currentPlayers >= maxPlayers;
    }

    public void addPlayer(Long playerId, int team) {
        if (team == 1) {
            if (!team1Players.contains(playerId)) {
                team1Players.add(playerId);
                currentPlayers++;
            }
        } else {
            if (!team2Players.contains(playerId)) {
                team2Players.add(playerId);
                currentPlayers++;
            }
        }
    }

    public void removePlayer(Long playerId) {
        if (team1Players.remove(playerId)) {
            currentPlayers--;
        }
        if (team2Players.remove(playerId)) {
            currentPlayers--;
        }
    }

    public int getPlayerTeam(Long playerId) {
        if (team1Players.contains(playerId)) {
            return 1;
        }
        if (team2Players.contains(playerId)) {
            return 2;
        }
        return 0;
    }

    public boolean hasPlayer(Long playerId) {
        return team1Players.contains(playerId) || team2Players.contains(playerId);
    }

    public List<Long> getAllPlayers() {
        List<Long> allPlayers = new ArrayList<>();
        allPlayers.addAll(team1Players);
        allPlayers.addAll(team2Players);
        return allPlayers;
    }
}