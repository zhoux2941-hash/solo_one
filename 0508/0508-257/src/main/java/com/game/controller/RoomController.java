package com.game.controller;

import com.game.common.Result;
import com.game.entity.*;
import com.game.service.MatchingService;
import com.game.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/room")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @Autowired
    private MatchingService matchingService;

    @PostMapping("/create")
    public Result<Room> createRoom(@RequestParam Long ownerId,
                                    @RequestParam String roomName,
                                    @RequestParam RoomType roomType,
                                    @RequestParam GameMode gameMode,
                                    @RequestParam(required = false) Rank minRank,
                                    @RequestParam(required = false) Rank maxRank,
                                    @RequestParam(required = false) String password) {
        try {
            Room room = roomService.createRoom(ownerId, roomName, roomType, gameMode, minRank, maxRank, password);
            return Result.success("房间创建成功", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/join")
    public Result<Room> joinRoom(@RequestParam Long playerId,
                                  @RequestParam String roomNumber,
                                  @RequestParam(required = false) String password) {
        try {
            Room room = roomService.joinRoom(playerId, roomNumber, password);
            return Result.success("加入房间成功", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/leave")
    public Result<String> leaveRoom(@RequestParam Long playerId,
                                   @RequestParam Long roomId) {
        try {
            roomService.leaveRoom(playerId, roomId);
            return Result.success("离开房间成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/disband")
    public Result<String> disbandRoom(@RequestParam Long roomId,
                                     @RequestParam Long operatorId) {
        try {
            roomService.disbandRoom(roomId, operatorId);
            return Result.success("房间解散成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/start")
    public Result<Room> startGame(@RequestParam Long roomId,
                                   @RequestParam Long operatorId) {
        try {
            Room room = roomService.startGame(roomId, operatorId);
            return Result.success("游戏开始", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/end")
    public Result<Room> endGame(@RequestParam Long roomId) {
        try {
            Room room = roomService.endGame(roomId);
            return Result.success("游戏结束", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/matching/start")
    public Result<Room> startMatching(@RequestParam Long roomId,
                                       @RequestParam Long operatorId) {
        try {
            Room room = roomService.startMatching(roomId, operatorId);
            return Result.success("开始匹配", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/matching/stop")
    public Result<Room> stopMatching(@RequestParam Long roomId,
                                      @RequestParam Long operatorId) {
        try {
            Room room = roomService.stopMatching(roomId, operatorId);
            return Result.success("停止匹配", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/team/change")
    public Result<Room> changeTeam(@RequestParam Long playerId,
                                    @RequestParam Long roomId,
                                    @RequestParam int targetTeam) {
        try {
            Room room = roomService.changeTeam(playerId, roomId, targetTeam);
            return Result.success("切换队伍成功", room);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{roomId}")
    public Result<Room> getRoom(@PathVariable Long roomId) {
        Room room = roomService.getRoom(roomId);
        if (room != null) {
            return Result.success(room);
        }
        return Result.error("房间不存在");
    }

    @GetMapping("/number/{roomNumber}")
    public Result<Room> getRoomByNumber(@PathVariable String roomNumber) {
        Room room = roomService.getRoomByNumber(roomNumber);
        if (room != null) {
            return Result.success(room);
        }
        return Result.error("房间不存在");
    }

    @GetMapping("/list")
    public Result<List<Room>> getAllRooms() {
        return Result.success(roomService.getAllRooms());
    }

    @GetMapping("/public")
    public Result<List<Room>> getPublicRooms() {
        return Result.success(roomService.getPublicRooms());
    }

    @GetMapping("/matching")
    public Result<List<Room>> getMatchingRooms() {
        return Result.success(roomService.getMatchingRooms());
    }

    @GetMapping("/types")
    public Result<RoomType[]> getRoomTypes() {
        return Result.success(RoomType.values());
    }

    @GetMapping("/modes")
    public Result<GameMode[]> getGameModes() {
        return Result.success(GameMode.values());
    }

    @GetMapping("/statuses")
    public Result<RoomStatus[]> getRoomStatuses() {
        return Result.success(RoomStatus.values());
    }

    @GetMapping("/{roomId}/balance")
    public Result<Map<String, Object>> getRoomBalance(@PathVariable Long roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) {
            return Result.error("房间不存在");
        }
        Map<String, Object> balanceInfo = matchingService.getRoomBalanceInfo(room);
        return Result.success(balanceInfo);
    }

    @GetMapping("/{roomId}/isBalanced")
    public Result<Boolean> isRoomBalanced(@PathVariable Long roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) {
            return Result.error("房间不存在");
        }
        boolean balanced = matchingService.isRoomBalanced(room);
        return Result.success(balanced);
    }
}