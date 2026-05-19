package com.music.repository;

import com.music.entity.PlayHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayHistoryRepository extends JpaRepository<PlayHistory, Long> {

    @Query("SELECT ph FROM PlayHistory ph WHERE ph.user.id = :userId ORDER BY ph.playedAt DESC")
    List<PlayHistory> findByUserId(Long userId, Pageable pageable);

    boolean existsByUserIdAndMusicId(Long userId, Long musicId);
}
