package com.music.repository;

import com.music.entity.Music;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicRepository extends JpaRepository<Music, Long> {

    Page<Music> findByStatus(String status, Pageable pageable);

    Page<Music> findByStatusAndTitleContaining(String status, String keyword, Pageable pageable);

    @Query("SELECT m FROM Music m WHERE m.status = 'APPROVED' ORDER BY m.playCount DESC")
    List<Music> findTopByPlayCount(Pageable pageable);

    List<Music> findByUploaderId(Long uploaderId);

    @Query("SELECT m FROM Music m WHERE m.status = 'APPROVED' AND m.tags LIKE %:tag%")
    List<Music> findByTag(String tag);
}
