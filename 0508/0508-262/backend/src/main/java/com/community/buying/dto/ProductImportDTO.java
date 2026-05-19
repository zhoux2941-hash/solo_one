package com.community.buying.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductImportDTO {
    private String productName;
    private String description;
    private String images;
    private Long categoryId;
    private BigDecimal originalPrice;
    private BigDecimal groupPrice;
    private Integer stock;
    private String unit;
    private String specs;
    private Integer isRecommend = 0;
    private Integer status = 1;
}