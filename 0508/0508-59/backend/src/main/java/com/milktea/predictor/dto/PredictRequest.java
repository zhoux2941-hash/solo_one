package com.milktea.predictor.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.List;

@Data
public class PredictRequest {
    @NotBlank(message = "茶底不能为空")
    private String teaBase;
    private List<String> toppings;
}
