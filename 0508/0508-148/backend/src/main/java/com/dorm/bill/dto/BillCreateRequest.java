package com.dorm.bill.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BillCreateRequest {
    private String billDate;
    private BigDecimal electricityAmount;
    private BigDecimal waterAmount;
}
