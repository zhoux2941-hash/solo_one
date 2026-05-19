package com.music.repository;

import com.music.entity.PlaylistMusic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistMusicRepository extends JpaRepository<PlaylistMusic, Long> {

    List<PlaylistMusic> findByPlaylistIdOrderByOrderNum(Long playlistId);

    Optional<PlaylistMusic> findByPlaylistIdAndMusicId(Long playlistId, Long musicId);

    void deleteByPlaylistIdAndMusicId(Long playlistId, Long musicId);

    boolean existsByPlaylistIdAndMusicId(Long playlistId, Long musicId);
}
