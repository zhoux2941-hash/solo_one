package com.opera.mask.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_design")
public class UserDesign {
    private Long id;
    private Long userId;
    private String userName;
    private Long templateId;
    private String name;
    private String description;
    private String designData;
    private String previewImage;
    private String svgContent;
    private Integer likeCount;
    private Integer commentCount;
    private Integer isPublic;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Integer deleted;
}
