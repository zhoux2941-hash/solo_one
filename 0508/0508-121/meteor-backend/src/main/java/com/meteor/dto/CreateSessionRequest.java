package com.meteor.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class CreateSessionRequest {
    @NotBlank(message = "流星雨名称不能为空")
    private String meteorShowerName;

    @NotBlank(message = "观测地点不能为空")
    private String location;

    private Double latitude;
    private Double longitude;

    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;

    private String userName;
    private String description;

    private Double cloudCover;

    private Double limitingMagnitude;
}
