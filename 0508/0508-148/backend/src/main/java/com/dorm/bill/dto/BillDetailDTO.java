package com.dorm.bill.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BillDetailDTO {
    private Long id;
    private String billDate;
    private BigDecimal electricityAmount;
    private BigDecimal waterAmount;
    private BigDecimal totalAmount;
    private BigDecimal perPersonAmount;
    private Integer headCount;
    private Integer paidCount;
    private Integer unpaidCount;
    private List<PaymentDetailDTO> payments;
}
