package com.game.social.service;

import com.game.social.entity.Blacklist;
import com.game.social.entity.Player;
import com.game.social.repository.BlacklistRepository;
import com.game.social.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BlacklistService {

    @Autowired
    private BlacklistRepository blacklistRepository;

    @Autowired
    private PlayerRepository playerRepository;

    public List<Blacklist> getBlacklistByPlayerId(Long playerId) {
        return blacklistRepository.findByPlayerId(playerId);
    }

    public Blacklist addToBlacklist(Long playerId, Long blockedPlayerId, String reason) {
        Optional<Blacklist> existingBlacklist = blacklistRepository.findByPlayerIdAndBlockedPlayerId(playerId, blockedPlayerId);
        if (existingBlacklist.isPresent()) {
            throw new RuntimeException("Player already in blacklist");
        }

        Player blockedPlayer = playerRepository.findById(blockedPlayerId)
                .orElseThrow(() -> new RuntimeException("Blocked player not found"));

        Blacklist blacklist = new Blacklist();
        blacklist.setPlayerId(playerId);
        blacklist.setBlockedPlayerId(blockedPlayerId);
        blacklist.setBlockedNickname(blockedPlayer.getNickname());
        blacklist.setReason(reason);
        blacklist.setCreateTime(LocalDateTime.now());

        return blacklistRepository.save(blacklist);
    }

    @Transactional
    public void removeFromBlacklist(Long playerId, Long blockedPlayerId) {
        blacklistRepository.deleteByPlayerIdAndBlockedPlayerId(playerId, blockedPlayerId);
    }

    public List<Blacklist> getAllBlacklists() {
        return blacklistRepository.findAll();
    }

    public Page<Blacklist> getBlacklistWithPagination(Long playerId, Pageable pageable) {
        if (playerId != null) {
            return blacklistRepository.findByPlayerId(playerId, pageable);
        }
        return blacklistRepository.findAll(pageable);
    }
}
