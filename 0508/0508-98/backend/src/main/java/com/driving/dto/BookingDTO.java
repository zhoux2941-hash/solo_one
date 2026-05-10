package com.driving.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
public class BookingDTO {
    @NotNull(message = "教练ID不能为空")
    private Long coachId;
    @NotNull(message = "日期不能为空")
    private LocalDate slotDate;
    @NotNull(message = "开始小时不能为空")
    private Integer startHour;
}