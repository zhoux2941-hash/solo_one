package com.game.social.repository;

import com.game.social.entity.Blacklist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, Long> {

    List<Blacklist> findByPlayerId(Long playerId);

    Page<Blacklist> findByPlayerId(Long playerId, Pageable pageable);

    Page<Blacklist> findAll(Pageable pageable);

    Optional<Blacklist> findByPlayerIdAndBlockedPlayerId(Long playerId, Long blockedPlayerId);

    void deleteByPlayerIdAndBlockedPlayerId(Long playerId, Long blockedPlayerId);
}
