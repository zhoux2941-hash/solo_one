package com.astro.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GuideStarRequest {

    @NotNull(message = "望远镜ID不能为空")
    private Long telescopeId;

    @NotBlank(message = "参考星名称不能为空")
    private String guideStarName;

    @NotNull(message = "参考星赤经不能为空")
    @Min(value = 0, message = "赤经不能小于0")
    @Max(value = 24, message = "赤经不能大于24")
    private Double guideStarRa;

    @NotNull(message = "参考星赤纬不能为空")
    @Min(value = -90, message = "赤纬不能小于-90")
    @Max(value = 90, message = "赤纬不能大于90")
    private Double guideStarDec;

    @NotNull(message = "目标赤经不能为空")
    @Min(value = 0, message = "赤经不能小于0")
    @Max(value = 24, message = "赤经不能大于24")
    private Double targetRa;

    @NotNull(message = "目标赤纬不能为空")
    @Min(value = -90, message = "赤纬不能小于-90")
    @Max(value = 90, message = "赤纬不能大于90")
    private Double targetDec;

    @NotNull(message = "观测时间不能为空")
    private LocalDateTime observationTime;

    private Integer exposureTime = 60;
}
