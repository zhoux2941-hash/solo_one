package com.opera.mask.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("comment")
public class Comment {
    private Long id;
    private Long designId;
    private Long userId;
    private String userName;
    private String content;
    private Long parentId;
    private Integer likeCount;
    private LocalDateTime createTime;
    private Integer deleted;
}
