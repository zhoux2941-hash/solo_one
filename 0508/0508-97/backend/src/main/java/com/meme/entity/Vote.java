package com.meme.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("vote")
public class Vote {
    private Long id;
    private Long userId;
    private Long memeId;
    private LocalDate voteDate;
    private LocalDateTime createdAt;
}
