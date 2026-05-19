package com.music.repository;

import com.music.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    Optional<ShareLink> findByShareCode(String shareCode);

    List<ShareLink> findByUserId(Long userId);

    @Query("SELECT s FROM ShareLink s WHERE s.expireAt IS NOT NULL AND s.expireAt < :now")
    List<ShareLink> findExpiredLinks(LocalDateTime now);
}
