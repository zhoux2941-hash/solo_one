package com.music.dto;

import com.music.entity.Playlist;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PlaylistDTO {

    private Long id;
    private String name;
    private String cover;
    private String description;
    private Long userId;
    private String userName;
    private Boolean isPublic;
    private Integer playCount;
    private Integer likeCount;
    private LocalDateTime createdAt;

    public static PlaylistDTO fromEntity(Playlist playlist) {
        PlaylistDTO dto = new PlaylistDTO();
        dto.setId(playlist.getId());
        dto.setName(playlist.getName());
        dto.setCover(playlist.getCover());
        dto.setDescription(playlist.getDescription());
        dto.setUserId(playlist.getUser().getId());
        dto.setUserName(playlist.getUser().getNickname());
        dto.setIsPublic(playlist.getIsPublic());
        dto.setPlayCount(playlist.getPlayCount());
        dto.setLikeCount(playlist.getLikeCount());
        dto.setCreatedAt(playlist.getCreatedAt());
        return dto;
    }
}
