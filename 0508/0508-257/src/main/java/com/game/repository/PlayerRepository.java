package com.game.repository;

import com.game.entity.Player;
import com.game.entity.Rank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    Optional<Player> findByUsername(String username);

    List<Player> findByOnlineTrue();

    List<Player> findByOnlineTrueAndInRoomFalse();

    List<Player> findByOnlineTrueAndInRoomFalseAndRank(Rank rank);

    long countByOnlineTrue();
}