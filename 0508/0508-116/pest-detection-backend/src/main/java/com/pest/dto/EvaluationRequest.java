package com.pest.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

@Data
public class EvaluationRequest {
    @NotBlank(message = "评价不能为空")
    private String evaluation;
}