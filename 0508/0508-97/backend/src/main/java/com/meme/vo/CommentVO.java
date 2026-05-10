package com.meme.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommentVO {
    private Long id;
    private Long memeId;
    private Long userId;
    private Long parentId;
    private Long replyToId;
    private String content;
    private LocalDateTime createdAt;
    private String nickname;
    private String replyToNickname;
    private List<CommentVO> replies;
}
