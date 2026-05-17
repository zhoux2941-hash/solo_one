package com.office.platform.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class AnnouncementDTO {

    private Long id;

    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    private Boolean isTop = false;

    private String expireTime;
}
