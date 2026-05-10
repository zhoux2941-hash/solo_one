package com.festival.volunteer.dto;

import com.festival.volunteer.entity.Position;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckInStats {
    private Long positionId;
    private String positionName;
    private Position.PositionType positionType;
    private Integer requiredCount;
    private Integer currentCount;
    private Integer checkedInCount;
    private Double checkInRate;
}
