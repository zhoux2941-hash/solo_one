package com.game.controller;

import com.game.common.Result;
import com.game.entity.RoomLog;
import com.game.service.RoomLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/log")
@CrossOrigin(origins = "*")
public class RoomLogController {

    @Autowired
    private RoomLogService roomLogService;

    @GetMapping("/room/{roomId}")
    public Result<List<RoomLog>> getRoomLogs(@PathVariable Long roomId) {
        return Result.success(roomLogService.getRoomLogs(roomId));
    }

    @GetMapping("/player/{playerId}")
    public Result<List<RoomLog>> getPlayerLogs(@PathVariable Long playerId) {
        return Result.success(roomLogService.getPlayerLogs(playerId));
    }

    @GetMapping("/recent")
    public Result<List<RoomLog>> getRecentLogs() {
        return Result.success(roomLogService.getRecentLogs());
    }

    @GetMapping("/all")
    public Result<List<RoomLog>> getAllLogs() {
        return Result.success(roomLogService.getAllLogs());
    }

    @GetMapping("/types")
    public Result<RoomLog.LogType[]> getLogTypes() {
        return Result.success(RoomLog.LogType.values());
    }
}