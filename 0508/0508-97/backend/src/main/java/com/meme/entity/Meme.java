package com.meme.entity;

import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("meme")
public class Meme {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private String tags;
    private String imageUrl;
    private String status;
    private Integer voteCount;
    private Long reviewerId;
    private String reviewComment;
    private LocalDateTime reviewedAt;
    private Integer magicScore;
    private Integer carelessScore;
    private Integer pkWins;
    private Integer pkLosses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private Integer deleted;

    public Double getPkRate() {
        if (pkWins == null || pkLosses == null) {
            return 0.0;
        }
        int total = pkWins + pkLosses;
        if (total == 0) {
            return 0.0;
        }
        return (double) pkWins / total * 100;
    }
}
