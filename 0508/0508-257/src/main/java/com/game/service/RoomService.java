package com.game.service;

import com.game.entity.*;
import com.game.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PlayerService playerService;

    @Autowired
    private RoomLogService roomLogService;

    @Autowired
    private MatchingService matchingService;

    public Room createRoom(Long ownerId, String roomName, RoomType roomType, GameMode gameMode,
                           Rank minRank, Rank maxRank, String password) {
        Player owner = playerService.getPlayer(ownerId);
        if (owner == null || !owner.isOnline()) {
            throw new RuntimeException("玩家不在线或不存在");
        }
        if (owner.isInRoom()) {
            throw new RuntimeException("玩家已在其他房间中");
        }

        Room room = new Room();
        room.setRoomNumber(generateRoomNumber());
        room.setRoomName(roomName);
        room.setOwnerId(ownerId);
        room.setOwnerName(owner.getNickname());
        room.setRoomType(roomType);
        room.setStatus(RoomStatus.WAITING);
        room.setGameMode(gameMode);
        room.setMinRank(minRank);
        room.setMaxRank(maxRank);
        room.setPassword(password);
        room.addPlayer(ownerId, 1);

        room = roomRepository.save(room);
        playerService.updatePlayerStatus(ownerId, true, room.getId());
        roomLogService.logRoomCreated(room);

        return room;
    }

    private String generateRoomNumber() {
        Random random = new Random();
        return String.valueOf(100000 + random.nextInt(900000));
    }

    public Room joinRoom(Long playerId, String roomNumber, String password) {
        Player player = playerService.getPlayer(playerId);
        if (player == null || !player.isOnline()) {
            throw new RuntimeException("玩家不在线或不存在");
        }
        if (player.isInRoom()) {
            throw new RuntimeException("玩家已在其他房间中");
        }

        Room room = roomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new RuntimeException("房间状态不允许加入");
        }

        if (room.isFull()) {
            throw new RuntimeException("房间已满");
        }

        if (room.getRoomType() == RoomType.PRIVATE) {
            if (password == null || !password.equals(room.getPassword())) {
                throw new RuntimeException("房间密码错误");
            }
        }

        if (room.getMinRank() != null && player.getRank().getLevel() < room.getMinRank().getLevel()) {
            throw new RuntimeException("段位低于房间最低要求");
        }
        if (room.getMaxRank() != null && player.getRank().getLevel() > room.getMaxRank().getLevel()) {
            throw new RuntimeException("段位高于房间最高要求");
        }

        int team = room.getTeam1Players().size() <= room.getTeam2Players().size() ? 1 : 2;
        room.addPlayer(playerId, team);
        room = roomRepository.save(room);
        playerService.updatePlayerStatus(playerId, true, room.getId());
        roomLogService.logPlayerJoined(room, playerId, player.getNickname());

        return room;
    }

    public void leaveRoom(Long playerId, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        Player player = playerService.getPlayer(playerId);
        if (player == null) {
            throw new RuntimeException("玩家不存在");
        }

        if (!room.hasPlayer(playerId)) {
            throw new RuntimeException("玩家不在此房间中");
        }

        room.removePlayer(playerId);
        playerService.updatePlayerStatus(playerId, false, null);
        roomLogService.logPlayerLeft(room, playerId, player.getNickname());

        if (room.getCurrentPlayers() == 0) {
            disbandRoom(roomId, room.getOwnerId());
        } else {
            if (room.getOwnerId().equals(playerId)) {
                Long newOwner = room.getAllPlayers().get(0);
                room.setOwnerId(newOwner);
                Player newOwnerPlayer = playerService.getPlayer(newOwner);
                room.setOwnerName(newOwnerPlayer.getNickname());
            }
            roomRepository.save(room);
        }
    }

    public void disbandRoom(Long roomId, Long operatorId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (!room.getOwnerId().equals(operatorId)) {
            throw new RuntimeException("只有房主可以解散房间");
        }

        List<Long> players = room.getAllPlayers();
        for (Long playerId : players) {
            playerService.updatePlayerStatus(playerId, false, null);
        }

        room.setStatus(RoomStatus.DISBANDED);
        roomRepository.save(room);
        roomLogService.logRoomDisbanded(room);
    }

    public Room startGame(Long roomId, Long operatorId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (!room.getOwnerId().equals(operatorId)) {
            throw new RuntimeException("只有房主可以开始游戏");
        }

        if (room.getStatus() != RoomStatus.WAITING && room.getStatus() != RoomStatus.MATCHING) {
            throw new RuntimeException("房间状态不允许开始游戏");
        }

        int requiredPlayers = room.getGameMode().getMaxPlayers();
        if (room.getCurrentPlayers() < requiredPlayers) {
            throw new RuntimeException("玩家人数不足，需要 " + requiredPlayers + " 名玩家");
        }

        if (room.getTeam1Players().isEmpty() || room.getTeam2Players().isEmpty()) {
            throw new RuntimeException("两个队伍都必须有玩家");
        }

        room.setStatus(RoomStatus.PLAYING);
        room.setStartTime(LocalDateTime.now());
        room = roomRepository.save(room);
        roomLogService.logGameStarted(room);

        return room;
    }

    public Room endGame(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (room.getStatus() != RoomStatus.PLAYING) {
            throw new RuntimeException("游戏未进行中");
        }

        room.setStatus(RoomStatus.FINISHED);
        room.setEndTime(LocalDateTime.now());
        room = roomRepository.save(room);
        roomLogService.logGameEnded(room);

        List<Long> players = room.getAllPlayers();
        for (Long playerId : players) {
            playerService.updatePlayerStatus(playerId, false, null);
        }

        return room;
    }

    public Room startMatching(Long roomId, Long operatorId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (!room.getOwnerId().equals(operatorId)) {
            throw new RuntimeException("只有房主可以开始匹配");
        }

        if (room.getRoomType() != RoomType.PUBLIC) {
            throw new RuntimeException("只有公开房间可以匹配");
        }

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new RuntimeException("房间状态不允许匹配");
        }

        room.setStatus(RoomStatus.MATCHING);
        room = roomRepository.save(room);
        roomLogService.logMatchingStarted(room);

        matchingService.addMatchingRoom(room);

        return room;
    }

    public Room stopMatching(Long roomId, Long operatorId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (!room.getOwnerId().equals(operatorId)) {
            throw new RuntimeException("只有房主可以停止匹配");
        }

        if (room.getStatus() != RoomStatus.MATCHING) {
            throw new RuntimeException("房间不在匹配中");
        }

        room.setStatus(RoomStatus.WAITING);
        room = roomRepository.save(room);
        matchingService.removeMatchingRoom(roomId);

        return room;
    }

    public Room changeTeam(Long playerId, Long roomId, int targetTeam) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("房间不存在"));

        if (!room.hasPlayer(playerId)) {
            throw new RuntimeException("玩家不在此房间中");
        }

        int currentTeam = room.getPlayerTeam(playerId);
        if (currentTeam == targetTeam) {
            return room;
        }

        int teamSize = targetTeam == 1 ? room.getTeam1Players().size() : room.getTeam2Players().size();
        int maxTeamSize = room.getGameMode().getMaxPlayers() / 2;
        if (teamSize >= maxTeamSize) {
            throw new RuntimeException("目标队伍已满");
        }

        room.removePlayer(playerId);
        room.addPlayer(playerId, targetTeam);

        return roomRepository.save(room);
    }

    public Room getRoom(Long roomId) {
        return roomRepository.findById(roomId).orElse(null);
    }

    public Room getRoomByNumber(String roomNumber) {
        return roomRepository.findByRoomNumber(roomNumber).orElse(null);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public List<Room> getPublicRooms() {
        return roomRepository.findByRoomTypeAndStatus(RoomType.PUBLIC, RoomStatus.WAITING);
    }

    public List<Room> getMatchingRooms() {
        return roomRepository.findByStatus(RoomStatus.MATCHING);
    }

    public long getRoomCountByStatus(RoomStatus status) {
        return roomRepository.countByStatus(status);
    }
}