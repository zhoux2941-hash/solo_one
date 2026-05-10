package com.meme.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("pk_battle")
public class PkBattle {
    private Long id;
    private Long userId;
    private Long meme1Id;
    private Long meme2Id;
    private Long winnerId;
    private LocalDateTime createdAt;
}
