package com.factory.materialcheck.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseItemDTO {
    private String materialCode;
    private String materialName;
    private Integer purchaseQuantity;
    private String unit;
}
