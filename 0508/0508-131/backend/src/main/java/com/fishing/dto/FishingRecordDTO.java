package com.fishing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FishingRecordDTO {
    private Long id;

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    private Long spotId;

    @NotNull(message = "鱼种ID不能为空")
    private Long fishSpeciesId;

    @NotNull(message = "拟饵ID不能为空")
    private Long lureId;

    @NotNull(message = "钓鱼日期不能为空")
    private LocalDate fishDate;

    @NotNull(message = "气温不能为空")
    private BigDecimal airTemp;

    @NotNull(message = "水温不能为空")
    private BigDecimal waterTemp;

    @NotNull(message = "气压不能为空")
    private BigDecimal airPressure;

    private String weather;
    private String waterVisibility;
    private Integer catchCount = 1;
    private Integer releaseCount = 0;
    private String notes;
}
