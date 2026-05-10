package com.opera.mask.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_favorite")
public class UserFavorite {
    private Long id;
    private Long userId;
    private Long designId;
    private LocalDateTime createTime;
}
