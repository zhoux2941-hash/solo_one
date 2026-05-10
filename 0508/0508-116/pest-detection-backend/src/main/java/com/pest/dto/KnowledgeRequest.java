package com.pest.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class KnowledgeRequest {
    @NotNull(message = "专家ID不能为空")
    private Long expertId;

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    @NotBlank(message = "适用作物不能为空")
    private String cropType;

    private String pestName;
}