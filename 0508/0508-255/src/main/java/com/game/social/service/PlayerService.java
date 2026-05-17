package com.game.social.service;

import com.game.social.entity.Player;
import com.game.social.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PlayerService {

    @Autowired
    private PlayerRepository playerRepository;

    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public Optional<Player> getPlayerById(Long id) {
        return playerRepository.findById(id);
    }

    public Player createPlayer(Player player) {
        Optional<Player> existingPlayer = playerRepository.findByUsername(player.getUsername());
        if (existingPlayer.isPresent()) {
            throw new RuntimeException("用户名已存在，请使用其他用户名");
        }
        player.setCreateTime(LocalDateTime.now());
        return playerRepository.save(player);
    }

    public Player updatePlayer(Long id, Player playerDetails) {
        Player player = playerRepository.findById(id).orElseThrow(() -> new RuntimeException("Player not found"));
        
        Optional<Player> existingPlayer = playerRepository.findByUsername(playerDetails.getUsername());
        if (existingPlayer.isPresent() && !existingPlayer.get().getId().equals(id)) {
            throw new RuntimeException("用户名已存在，请使用其他用户名");
        }
        
        player.setUsername(playerDetails.getUsername());
        player.setNickname(playerDetails.getNickname());
        player.setLevel(playerDetails.getLevel());
        player.setAvatar(playerDetails.getAvatar());
        return playerRepository.save(player);
    }

    public void deletePlayer(Long id) {
        playerRepository.deleteById(id);
    }

    public List<Player> searchPlayersByNickname(String nickname) {
        return playerRepository.findByNicknameContaining(nickname);
    }

    public Page<Player> getPlayersWithPagination(Pageable pageable) {
        return playerRepository.findAll(pageable);
    }
}
