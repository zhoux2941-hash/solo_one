package com.meme.entity;

import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("comment")
public class Comment {
    private Long id;
    private Long memeId;
    private Long userId;
    private Long parentId;
    private Long replyToId;
    private String content;
    private LocalDateTime createdAt;
    @TableLogic
    private Integer deleted;
}
