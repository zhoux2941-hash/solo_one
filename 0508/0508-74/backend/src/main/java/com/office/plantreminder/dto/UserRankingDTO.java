package com.office.plantreminder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRankingDTO {
    private String username;
    private Long wateringCount;
    private Integer rank;
}
