package com.bus.scheduling.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchedulingRequestDTO {

    @NotEmpty(message = "时段需求不能为空")
    private List<TimeSlotRequirement> requirements;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlotRequirement {
        @NotNull(message = "开始时间不能为空")
        private Integer startHour;

        @NotNull(message = "结束时间不能为空")
        private Integer endHour;

        @NotNull(message = "需要司机数量不能为空")
        private Integer driverCount;
    }
}
