package com.meme.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class ReviewRequest {
    @NotBlank(message = "审核状态不能为空")
    private String status;

    private String reviewComment;
}
