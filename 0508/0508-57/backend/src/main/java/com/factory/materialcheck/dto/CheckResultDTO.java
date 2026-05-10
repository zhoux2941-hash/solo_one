package com.factory.materialcheck.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckResultDTO {
    private Double kitRate;
    private String kitRatePercent;
    private Integer orderQuantity;
    private Integer maxProducibleQuantity;
    private List<MaterialStatusDTO> materials;
    private List<PurchaseItemDTO> purchaseList;
    private boolean isAllSufficient;
}
