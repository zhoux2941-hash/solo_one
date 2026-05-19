package com.music.repository;

import com.music.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdAndType(Long userId, String type);

    Optional<Favorite> findByUserIdAndMusicId(Long userId, Long musicId);

    Optional<Favorite> findByUserIdAndPlaylistId(Long userId, Long playlistId);

    boolean existsByUserIdAndMusicId(Long userId, Long musicId);

    boolean existsByUserIdAndPlaylistId(Long userId, Long playlistId);
}
