package com.astronomy.variablestar.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ObservationRequestDTO {

    @NotNull(message = "变星ID不能为空")
    private Long variableStarId;

    private String observerName;

    @NotNull(message = "观测时间不能为空")
    private LocalDateTime observationTime;

    @NotNull(message = "参考星A ID不能为空")
    private Long referenceStarAId;

    @NotNull(message = "参考星B ID不能为空")
    private Long referenceStarBId;

    @NotNull(message = "与参考星A的亮度比较不能为空")
    @DecimalMin(value = "-5.0", message = "比较值不能小于-5.0")
    @DecimalMax(value = "5.0", message = "比较值不能大于5.0")
    private BigDecimal comparisonA;

    @NotNull(message = "与参考星B的亮度比较不能为空")
    @DecimalMin(value = "-5.0", message = "比较值不能小于-5.0")
    @DecimalMax(value = "5.0", message = "比较值不能大于5.0")
    private BigDecimal comparisonB;

    private String observationMethod;

    private String instrument;

    private String skyConditions;

    private String notes;
}
