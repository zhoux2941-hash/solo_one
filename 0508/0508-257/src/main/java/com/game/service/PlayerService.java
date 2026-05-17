package com.game.service;

import com.game.entity.Player;
import com.game.entity.Rank;
import com.game.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class PlayerService {

    @Autowired
    private PlayerRepository playerRepository;

    public Player register(String username, String nickname, Rank rank) {
        if (playerRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("用户名已存在");
        }
        Player player = new Player(username, nickname, rank);
        return playerRepository.save(player);
    }

    public Player login(String username) {
        Optional<Player> playerOpt = playerRepository.findByUsername(username);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            player.setOnline(true);
            player.setLastOnlineTime(LocalDateTime.now());
            return playerRepository.save(player);
        }
        throw new RuntimeException("玩家不存在");
    }

    public void logout(Long playerId) {
        Optional<Player> playerOpt = playerRepository.findById(playerId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            player.setOnline(false);
            player.setInRoom(false);
            player.setCurrentRoomId(null);
            player.setLastOnlineTime(LocalDateTime.now());
            playerRepository.save(player);
        }
    }

    public Player getPlayer(Long playerId) {
        return playerRepository.findById(playerId).orElse(null);
    }

    public Player getPlayerByUsername(String username) {
        return playerRepository.findByUsername(username).orElse(null);
    }

    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public List<Player> getOnlinePlayers() {
        return playerRepository.findByOnlineTrue();
    }

    public List<Player> getAvailablePlayers() {
        return playerRepository.findByOnlineTrueAndInRoomFalse();
    }

    public List<Player> getAvailablePlayersByRank(Rank rank) {
        return playerRepository.findByOnlineTrueAndInRoomFalseAndRank(rank);
    }

    public void updatePlayerStatus(Long playerId, boolean inRoom, Long roomId) {
        Optional<Player> playerOpt = playerRepository.findById(playerId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            player.setInRoom(inRoom);
            player.setCurrentRoomId(roomId);
            playerRepository.save(player);
        }
    }

    public void heartbeat(Long playerId) {
        Optional<Player> playerOpt = playerRepository.findById(playerId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            player.setLastOnlineTime(LocalDateTime.now());
            playerRepository.save(player);
        }
    }

    @Scheduled(fixedRate = 30000)
    public void checkOfflinePlayers() {
        LocalDateTime timeout = LocalDateTime.now().minusMinutes(2);
        List<Player> onlinePlayers = playerRepository.findByOnlineTrue();
        for (Player player : onlinePlayers) {
            if (player.getLastOnlineTime().isBefore(timeout)) {
                player.setOnline(false);
                player.setInRoom(false);
                player.setCurrentRoomId(null);
                playerRepository.save(player);
            }
        }
    }

    public long getOnlinePlayerCount() {
        return playerRepository.countByOnlineTrue();
    }

    public void initTestData() {
        if (playerRepository.count() == 0) {
            Random random = new Random();
            Rank[] ranks = Rank.values();
            String[] names = {"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "王十二"};
            
            for (int i = 1; i <= 10; i++) {
                String username = "player" + i;
                String nickname = names[i - 1];
                Rank rank = ranks[random.nextInt(ranks.length)];
                Player player = new Player(username, nickname, rank);
                player.setOnline(i <= 5);
                playerRepository.save(player);
            }
        }
    }
}