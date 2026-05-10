package com.astro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotInfo {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean available;
    private String bookedBy;
    private String bookingId;
}
