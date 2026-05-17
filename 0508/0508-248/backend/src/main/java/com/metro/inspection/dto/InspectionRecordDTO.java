package com.metro.inspection.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class InspectionRecordDTO {

    @NotBlank(message = "线路区间不能为空")
    private String section;

    @NotBlank(message = "里程桩号不能为空")
    private String mileage;

    @NotBlank(message = "钢轨位置不能为空")
    private String railPosition;

    @NotBlank(message = "伤损类型不能为空")
    private String damageType;

    @NotNull(message = "伤损深度不能为空")
    @Positive(message = "伤损深度必须大于0")
    private Double depth;

    private Integer lineSpeed;

    @NotBlank(message = "检测日期不能为空")
    private String inspectionDate;
}
