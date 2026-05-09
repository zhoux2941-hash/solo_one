package com.company.seatbooking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BookingRequest {
    
    @NotNull(message = "工位ID不能为空")
    private Long seatId;
    
    @NotNull(message = "用户ID不能为空")
    private Long userId;
    
    @NotNull(message = "日期不能为空")
    private LocalDate date;
    
    @NotNull(message = "时段不能为空")
    private String timeSlot;
}
