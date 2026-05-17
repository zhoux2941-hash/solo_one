package com.metro.inspection.dto;

import com.metro.inspection.entity.WorkOrder;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InspectionResponse {
    private String message;
    private Object inspectionRecord;
    private WorkOrder workOrder;
}
