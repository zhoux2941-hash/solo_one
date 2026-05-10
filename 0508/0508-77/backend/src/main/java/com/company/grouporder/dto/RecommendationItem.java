package com.company.grouporder.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RecommendationItem {
    private String name;
    private BigDecimal price;
    private String suggestion;
    
    public RecommendationItem(String name, BigDecimal price, String suggestion) {
        this.name = name;
        this.price = price;
        this.suggestion = suggestion;
    }
}
