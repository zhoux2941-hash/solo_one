package com.astro.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingRequest {

    @NotNull(message = "望远镜ID不能为空")
    private Long telescopeId;

    @NotBlank(message = "用户ID不能为空")
    private String userId;

    @NotBlank(message = "用户名称不能为空")
    private String userName;

    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endTime;

    @NotNull(message = "赤经不能为空")
    @Min(value = 0, message = "赤经不能小于0")
    @Max(value = 24, message = "赤经不能大于24")
    private Double ra;

    @NotNull(message = "赤纬不能为空")
    @Min(value = -90, message = "赤纬不能小于-90")
    @Max(value = 90, message = "赤纬不能大于90")
    private Double dec;

    @NotNull(message = "曝光时间不能为空")
    @Min(value = 1, message = "曝光时间至少1秒")
    @Max(value = 3600, message = "曝光时间不能超过3600秒")
    private Integer exposureTime;

    @NotBlank(message = "目标名称不能为空")
    private String targetName;
}
