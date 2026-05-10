package com.canteen.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class DailySummaryDTO {
    private LocalDate date;
    private BigDecimal lunch;
    private BigDecimal dinner;
    private BigDecimal total;
}
