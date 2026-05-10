package com.milktea.predictor.dto;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
public class FeedbackRequest {
    @NotBlank(message = "茶底不能为空")
    private String teaBase;
    
    private List<String> toppings;
    
    @NotNull(message = "预测评分不能为空")
    private BigDecimal predictedRating;
    
    @NotNull(message = "实际评分不能为空")
    @Min(value = 1, message = "评分最低为1")
    @Max(value = 10, message = "评分最高为10")
    private Integer actualRating;
}
