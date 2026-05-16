package com.asset.config;

import com.asset.model.Asset;
import com.asset.model.AssetStatus;
import com.asset.model.AssetType;
import com.asset.repository.AssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AssetRepository assetRepository;

    @Override
    public void run(String... args) throws Exception {
        if (assetRepository.count() == 0) {
            createAsset("NB-001", AssetType.LAPTOP, "Dell", LocalDate.of(2024, 1, 15), AssetStatus.IN_STOCK, null, null, null);
            createAsset("NB-002", AssetType.LAPTOP, "Lenovo", LocalDate.of(2024, 2, 20), AssetStatus.IN_STOCK, null, null, null);
            createAsset("NB-003", AssetType.LAPTOP, "HP", LocalDate.of(2024, 3, 10), AssetStatus.IN_STOCK, null, null, null);
            createAsset("MON-001", AssetType.MONITOR, "Dell", LocalDate.of(2024, 1, 20), AssetStatus.IN_STOCK, null, null, null);
            createAsset("MON-002", AssetType.MONITOR, "LG", LocalDate.of(2024, 2, 15), AssetStatus.IN_STOCK, null, null, null);
            createAsset("KEY-001", AssetType.KEYBOARD, "Logitech", LocalDate.of(2024, 1, 25), AssetStatus.IN_STOCK, null, null, null);
            createAsset("MOU-001", AssetType.MOUSE, "Logitech", LocalDate.of(2024, 1, 25), AssetStatus.IN_STOCK, null, null, null);
            createAsset("HED-001", AssetType.HEADSET, "Sony", LocalDate.of(2024, 2, 1), AssetStatus.IN_STOCK, null, null, null);
            
            createAllocatedAsset("NB-004", AssetType.LAPTOP, "MacBook Pro", LocalDate.of(2024, 1, 10), "张三", "研发部", LocalDate.now().minusDays(45));
            createAllocatedAsset("MON-003", AssetType.MONITOR, "Samsung", LocalDate.of(2024, 3, 5), "李四", "市场部", LocalDate.now().minusDays(15));
        }
    }

    private void createAsset(String assetNumber, AssetType type, String brand, LocalDate purchaseDate, AssetStatus status, 
                            String holder, String department, LocalDate allocateDate) {
        Asset asset = new Asset();
        asset.setAssetNumber(assetNumber);
        asset.setType(type);
        asset.setBrand(brand);
        asset.setPurchaseDate(purchaseDate);
        asset.setStatus(status);
        asset.setCurrentHolder(holder);
        asset.setHolderDepartment(department);
        asset.setAllocateDate(allocateDate);
        assetRepository.save(asset);
    }

    private void createAllocatedAsset(String assetNumber, AssetType type, String brand, LocalDate purchaseDate, 
                                      String holder, String department, LocalDate allocateDate) {
        createAsset(assetNumber, type, brand, purchaseDate, AssetStatus.ALLOCATED, holder, department, allocateDate);
    }
}
