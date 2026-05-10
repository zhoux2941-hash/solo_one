package com.guqin.tuner.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TuningRecordCreateDTO {
    private Long guqinId;
    private LocalDateTime recordTime;
    private String notes;
    private List<HuiPositionDetailDTO> huiDetails;
}
