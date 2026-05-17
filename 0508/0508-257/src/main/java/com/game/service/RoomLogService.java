package com.game.service;

import com.game.entity.Room;
import com.game.entity.RoomLog;
import com.game.repository.RoomLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomLogService {

    @Autowired
    private RoomLogRepository roomLogRepository;

    public void logRoomCreated(Room room) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getOwnerId(),
                room.getOwnerName(),
                RoomLog.LogType.ROOM_CREATED,
                "房间创建成功，房主：" + room.getOwnerName()
        );
        roomLogRepository.save(log);
    }

    public void logRoomDisbanded(Room room) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getOwnerId(),
                room.getOwnerName(),
                RoomLog.LogType.ROOM_DISBANDED,
                "房间已解散"
        );
        roomLogRepository.save(log);
    }

    public void logPlayerJoined(Room room, Long playerId, String playerName) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                playerId,
                playerName,
                RoomLog.LogType.PLAYER_JOINED,
                playerName + " 加入了房间"
        );
        roomLogRepository.save(log);
    }

    public void logPlayerLeft(Room room, Long playerId, String playerName) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                playerId,
                playerName,
                RoomLog.LogType.PLAYER_LEFT,
                playerName + " 离开了房间"
        );
        roomLogRepository.save(log);
    }

    public void logGameStarted(Room room) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getOwnerId(),
                room.getOwnerName(),
                RoomLog.LogType.GAME_STARTED,
                "游戏开始，共 " + room.getCurrentPlayers() + " 名玩家"
        );
        roomLogRepository.save(log);
    }

    public void logGameEnded(Room room) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getOwnerId(),
                room.getOwnerName(),
                RoomLog.LogType.GAME_ENDED,
                "游戏结束"
        );
        roomLogRepository.save(log);
    }

    public void logMatchingStarted(Room room) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getOwnerId(),
                room.getOwnerName(),
                RoomLog.LogType.MATCHING_STARTED,
                "开始自动匹配玩家"
        );
        roomLogRepository.save(log);
    }

    public void logMatchingSuccess(Room room, int matchedCount) {
        RoomLog log = new RoomLog(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomName(),
                room.getOwnerId(),
                room.getOwnerName(),
                RoomLog.LogType.MATCHING_SUCCESS,
                "匹配成功，新增 " + matchedCount + " 名玩家"
        );
        roomLogRepository.save(log);
    }

    public List<RoomLog> getRoomLogs(Long roomId) {
        return roomLogRepository.findByRoomIdOrderByCreateTimeDesc(roomId);
    }

    public List<RoomLog> getPlayerLogs(Long playerId) {
        return roomLogRepository.findByPlayerIdOrderByCreateTimeDesc(playerId);
    }

    public List<RoomLog> getRecentLogs() {
        return roomLogRepository.findTop50ByOrderByCreateTimeDesc();
    }

    public List<RoomLog> getAllLogs() {
        return roomLogRepository.findAll();
    }
}