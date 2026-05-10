package com.escaperoom.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class PuzzleDTO {
    private Long id;
    
    @NotBlank(message = "谜题名称不能为空")
    @Size(max = 200, message = "谜题名称长度不能超过200")
    private String name;
    
    @NotBlank(message = "谜面不能为空")
    private String puzzleText;
    
    @NotBlank(message = "解谜方式不能为空")
    private String solutionMethod;
    
    @NotBlank(message = "答案不能为空")
    @Size(max = 500, message = "答案长度不能超过500")
    private String answer;
    
    private String unlockCondition;
    
    private Integer orderIndex;
    
    private Integer version;
    
    private Long sceneId;
}
