package com.meme.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class MemeUploadRequest {
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题不能超过100个字符")
    private String title;

    @Size(max = 500, message = "描述不能超过500个字符")
    private String description;

    @Size(max = 200, message = "标签不能超过200个字符")
    private String tags;
}
