package com.game.controller;

import com.game.common.Result;
import com.game.entity.Player;
import com.game.entity.Rank;
import com.game.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import java.util.List;

@RestController
@RequestMapping("/api/player")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @PostConstruct
    public void init() {
        playerService.initTestData();
    }

    @PostMapping("/register")
    public Result<Player> register(@RequestParam String username,
                                    @RequestParam String nickname,
                                    @RequestParam Rank rank) {
        try {
            Player player = playerService.register(username, nickname, rank);
            return Result.success("注册成功", player);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public Result<Player> login(@RequestParam String username) {
        try {
            Player player = playerService.login(username);
            return Result.success("登录成功", player);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<Void> logout(@RequestParam Long playerId) {
        try {
            playerService.logout(playerId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/heartbeat")
    public Result<Void> heartbeat(@RequestParam Long playerId) {
        try {
            playerService.heartbeat(playerId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{playerId}")
    public Result<Player> getPlayer(@PathVariable Long playerId) {
        Player player = playerService.getPlayer(playerId);
        if (player != null) {
            return Result.success(player);
        }
        return Result.error("玩家不存在");
    }

    @GetMapping("/list")
    public Result<List<Player>> getAllPlayers() {
        return Result.success(playerService.getAllPlayers());
    }

    @GetMapping("/online")
    public Result<List<Player>> getOnlinePlayers() {
        return Result.success(playerService.getOnlinePlayers());
    }

    @GetMapping("/available")
    public Result<List<Player>> getAvailablePlayers() {
        return Result.success(playerService.getAvailablePlayers());
    }

    @GetMapping("/online/count")
    public Result<Long> getOnlinePlayerCount() {
        return Result.success(playerService.getOnlinePlayerCount());
    }

    @GetMapping("/ranks")
    public Result<Rank[]> getRanks() {
        return Result.success(Rank.values());
    }
}