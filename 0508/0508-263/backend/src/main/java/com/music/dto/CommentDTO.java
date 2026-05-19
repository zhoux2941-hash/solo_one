package com.music.dto;

import com.music.entity.Comment;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentDTO {

    private Long id;
    private Long musicId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String content;
    private Long parentId;
    private Integer likeCount;
    private LocalDateTime createdAt;

    public static CommentDTO fromEntity(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setMusicId(comment.getMusic().getId());
        dto.setUserId(comment.getUser().getId());
        dto.setUserName(comment.getUser().getNickname());
        dto.setUserAvatar(comment.getUser().getAvatar());
        dto.setContent(comment.getContent());
        if (comment.getParent() != null) {
            dto.setParentId(comment.getParent().getId());
        }
        dto.setLikeCount(comment.getLikeCount());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
}
