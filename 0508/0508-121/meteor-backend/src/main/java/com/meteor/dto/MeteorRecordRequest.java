package com.meteor.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;

@Data
public class MeteorRecordRequest {
    @NotBlank(message = "星座区域不能为空")
    private String constellation;

    @DecimalMin(value = "-2.0", message = "亮度不能小于-2等")
    @DecimalMax(value = "4.0", message = "亮度不能大于+4等")
    private Double brightness;

    private String color;

    private Double trajectoryStartRA;
    private Double trajectoryStartDec;
    private Double trajectoryEndRA;
    private Double trajectoryEndDec;

    private String notes;
}
