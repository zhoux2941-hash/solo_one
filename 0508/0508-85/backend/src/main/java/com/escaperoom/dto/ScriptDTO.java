package com.escaperoom.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class ScriptDTO {
    private Long id;
    
    @NotBlank(message = "剧本名称不能为空")
    @Size(max = 200, message = "剧本名称长度不能超过200")
    private String name;
    
    private String backgroundStory;
    
    @NotBlank(message = "难度不能为空")
    private String difficulty;
    
    private List<SceneDTO> scenes;
}
