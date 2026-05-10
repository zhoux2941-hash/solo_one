package com.meme.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class PkSubmitRequest {
    @NotNull(message = "表情包1不能为空")
    private Long meme1Id;

    @NotNull(message = "表情包2不能为空")
    private Long meme2Id;

    @NotNull(message = "获胜者不能为空")
    private Long winnerId;
}
