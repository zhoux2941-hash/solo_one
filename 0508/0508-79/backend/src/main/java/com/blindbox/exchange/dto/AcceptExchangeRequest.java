package com.blindbox.exchange.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AcceptExchangeRequest {
    private BigDecimal myBoxPrice;
    private BigDecimal otherBoxPrice;
}
