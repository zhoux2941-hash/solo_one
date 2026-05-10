package com.meme.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class CommentRequest {
    @NotNull(message = "表情包ID不能为空")
    private Long memeId;

    private Long parentId;

    private Long replyToId;

    @NotBlank(message = "评论内容不能为空")
    @Size(max = 500, message = "评论内容不能超过500个字符")
    private String content;
}
