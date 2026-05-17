package com.game.social.repository;

import com.game.social.entity.Friend;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {

    List<Friend> findByPlayerId(Long playerId);

    Page<Friend> findByPlayerId(Long playerId, Pageable pageable);

    Optional<Friend> findByPlayerIdAndFriendId(Long playerId, Long friendId);

    void deleteByPlayerIdAndFriendId(Long playerId, Long friendId);
}
