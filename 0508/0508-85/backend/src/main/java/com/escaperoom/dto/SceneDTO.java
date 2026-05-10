package com.escaperoom.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class SceneDTO {
    private Long id;
    
    @NotBlank(message = "场景名称不能为空")
    @Size(max = 200, message = "场景名称长度不能超过200")
    private String name;
    
    private String description;
    
    private String imageUrl;
    
    private Integer orderIndex;
    
    private Long scriptId;
    
    private List<PuzzleDTO> puzzles;
}
