package com.factory.materialcheck.service;

import com.factory.materialcheck.dto.CheckResultDTO;
import com.factory.materialcheck.dto.MaterialStatusDTO;
import com.factory.materialcheck.dto.PurchaseItemDTO;
import com.factory.materialcheck.entity.Material;
import com.factory.materialcheck.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    @Cacheable(value = "materialCheck", key = "#orderQuantity")
    @Transactional(readOnly = true)
    public CheckResultDTO checkKitRate(Integer orderQuantity) {
        if (orderQuantity == null || orderQuantity <= 0) {
            throw new IllegalArgumentException("订单数量必须为正整数");
        }

        List<Material> materials = materialRepository.findAll();
        List<MaterialStatusDTO> materialStatusList = new ArrayList<>();
        List<PurchaseItemDTO> purchaseList = new ArrayList<>();
        List<Double> rates = new ArrayList<>();
        boolean allSufficient = true;

        for (Material material : materials) {
            int requiredQuantity = material.getUnitDemand() * orderQuantity;
            int currentStock = material.getCurrentStock();
            int shortage = Math.max(0, requiredQuantity - currentStock);
            boolean isSufficient = shortage == 0;

            if (!isSufficient) {
                allSufficient = false;
                purchaseList.add(new PurchaseItemDTO(
                        material.getMaterialCode(),
                        material.getMaterialName(),
                        shortage,
                        material.getUnit()
                ));
            }

            double rate = requiredQuantity > 0 
                ? (double) currentStock / requiredQuantity 
                : Double.MAX_VALUE;
            rates.add(rate);

            materialStatusList.add(new MaterialStatusDTO(
                    material.getMaterialCode(),
                    material.getMaterialName(),
                    currentStock,
                    requiredQuantity,
                    shortage,
                    isSufficient,
                    material.getUnit()
            ));
        }

        Double minRate = rates.stream().min(Double::compareTo).orElse(0.0);
        int maxProducibleQuantity = materials.stream()
                .mapToInt(m -> m.getCurrentStock() / m.getUnitDemand())
                .min()
                .orElse(0);

        materialStatusList.sort(Comparator.comparing(MaterialStatusDTO::isSufficient)
                .thenComparing(MaterialStatusDTO::getMaterialCode));

        double displayRate = Math.min(minRate, 1.0);
        
        CheckResultDTO result = new CheckResultDTO();
        result.setKitRate(displayRate);
        result.setKitRatePercent(formatPercentage(displayRate));
        result.setOrderQuantity(orderQuantity);
        result.setMaxProducibleQuantity(maxProducibleQuantity);
        result.setMaterials(materialStatusList);
        result.setPurchaseList(purchaseList);
        result.setAllSufficient(allSufficient);

        return result;
    }

    private String formatPercentage(double value) {
        BigDecimal decimal = BigDecimal.valueOf(value * 100).setScale(2, RoundingMode.HALF_UP);
        return decimal + "%";
    }
}
