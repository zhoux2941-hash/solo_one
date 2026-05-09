package com.wheelchair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WearDataResponse {
    private String wheelchairId;
    private Integer currentWear;
    private String recordDate;
}
