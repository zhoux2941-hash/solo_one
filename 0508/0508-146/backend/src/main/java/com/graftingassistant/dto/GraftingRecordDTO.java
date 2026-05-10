package com.graftingassistant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GraftingRecordDTO {
    private Long rootstockId;
    private Long scionId;
    private LocalDate graftingDate;
    private String method;
    private Integer totalCount;
    private String notes;
}
