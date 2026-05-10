package com.construction.progress.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class CommentDTO {
    @NotNull
    private Long projectId;
    
    @NotBlank
    private String content;
    
    private String type = "MESSAGE";
}
