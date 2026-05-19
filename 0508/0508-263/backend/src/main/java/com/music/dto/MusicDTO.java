package com.music.dto;

import com.music.entity.Music;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MusicDTO {

    private Long id;
    private String title;
    private String artist;
    private String album;
    private String cover;
    private String filePath;
    private Integer duration;
    private String tags;
    private String description;
    private Long uploaderId;
    private String uploaderName;
    private String status;
    private Integer playCount;
    private Integer likeCount;
    private LocalDateTime createdAt;

    public static MusicDTO fromEntity(Music music) {
        MusicDTO dto = new MusicDTO();
        dto.setId(music.getId());
        dto.setTitle(music.getTitle());
        dto.setArtist(music.getArtist());
        dto.setAlbum(music.getAlbum());
        dto.setCover(music.getCover());
        dto.setFilePath(music.getFilePath());
        dto.setDuration(music.getDuration());
        dto.setTags(music.getTags());
        dto.setDescription(music.getDescription());
        dto.setUploaderId(music.getUploader().getId());
        dto.setUploaderName(music.getUploader().getNickname());
        dto.setStatus(music.getStatus());
        dto.setPlayCount(music.getPlayCount());
        dto.setLikeCount(music.getLikeCount());
        dto.setCreatedAt(music.getCreatedAt());
        return dto;
    }
}
