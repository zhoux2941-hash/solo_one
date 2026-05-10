package com.dorm.bill.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentDetailDTO {
    private Long userId;
    private String nickname;
    private String username;
    private BigDecimal amount;
    private Integer status;
    private LocalDateTime paidAt;
}
