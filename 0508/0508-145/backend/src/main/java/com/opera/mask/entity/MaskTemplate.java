package com.opera.mask.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("mask_template")
public class MaskTemplate {
    private Long id;
    private String name;
    private String description;
    private String type;
    private String svgContent;
    private String regions;
    private String previewImage;
    private Integer isDefault;
    private Long createBy;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Integer deleted;
}
