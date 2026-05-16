package com.asset.service;

import com.asset.model.Asset;
import com.asset.model.AssetStatus;
import com.asset.repository.AssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    public Page<Asset> getAllAssets(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return assetRepository.findAll(pageable);
    }

    public Optional<Asset> getAssetById(Long id) {
        return assetRepository.findById(id);
    }

    public List<Asset> getAssetsByStatus(AssetStatus status) {
        return assetRepository.findByStatus(status);
    }

    public Page<Asset> getAssetsByStatus(AssetStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return assetRepository.findByStatus(status, pageable);
    }

    @Transactional
    public Asset createAsset(Asset asset) {
        if (assetRepository.existsByAssetNumber(asset.getAssetNumber())) {
            throw new RuntimeException("资产编号已存在");
        }
        asset.setStatus(AssetStatus.IN_STOCK);
        return assetRepository.save(asset);
    }

    @Transactional
    public Asset updateAsset(Long id, Asset assetDetails) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("资产不存在"));
        
        asset.setType(assetDetails.getType());
        asset.setBrand(assetDetails.getBrand());
        asset.setPurchaseDate(assetDetails.getPurchaseDate());
        asset.setRemarks(assetDetails.getRemarks());
        
        return assetRepository.save(asset);
    }

    @Transactional
    public void deleteAsset(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("资产不存在"));
        assetRepository.delete(asset);
    }

    @Transactional
    public Asset allocateAsset(Long assetId, String holder, String department, LocalDate allocateDate, LocalDate expectedReturnDate) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("资产不存在"));
        
        if (asset.getStatus() != AssetStatus.IN_STOCK) {
            throw new RuntimeException("资产不在库中，无法领用");
        }
        
        asset.setStatus(AssetStatus.ALLOCATED);
        asset.setCurrentHolder(holder);
        asset.setHolderDepartment(department);
        asset.setAllocateDate(allocateDate);
        asset.setExpectedReturnDate(expectedReturnDate);
        
        return assetRepository.save(asset);
    }

    @Transactional
    public Asset returnAsset(Long assetId, String remarks) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("资产不存在"));
        
        if (asset.getStatus() != AssetStatus.ALLOCATED) {
            throw new RuntimeException("该资产未被领用");
        }
        
        asset.setStatus(AssetStatus.IN_STOCK);
        asset.setCurrentHolder(null);
        asset.setHolderDepartment(null);
        asset.setAllocateDate(null);
        asset.setExpectedReturnDate(null);
        if (remarks != null && !remarks.isEmpty()) {
            asset.setRemarks(remarks);
        }
        
        return assetRepository.save(asset);
    }

    @Transactional
    public Asset updateAssetStatus(Long assetId, AssetStatus newStatus) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("资产不存在"));
        asset.setStatus(newStatus);
        return assetRepository.save(asset);
    }

    public List<Asset> getOverdueAssets(int daysThreshold) {
        LocalDate thresholdDate = LocalDate.now().minusDays(daysThreshold);
        return assetRepository.findOverdueAssets(thresholdDate);
    }

    public Page<Asset> getOverdueAssets(int daysThreshold, int page, int size) {
        LocalDate thresholdDate = LocalDate.now().minusDays(daysThreshold);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "allocateDate"));
        return assetRepository.findOverdueAssets(thresholdDate, pageable);
    }

    public Map<String, Map<String, Object>> getDepartmentStatistics() {
        List<String> departments = assetRepository.findAllDepartments();
        List<Object[]> allocatedByDept = assetRepository.countAllocatedByDepartment();
        
        Map<String, Long> allocatedMap = new HashMap<>();
        for (Object[] row : allocatedByDept) {
            allocatedMap.put((String) row[0], (Long) row[1]);
        }
        
        Map<String, Map<String, Object>> result = new HashMap<>();
        for (String dept : departments) {
            Long total = assetRepository.countTotalByDepartment(dept);
            Long allocated = allocatedMap.getOrDefault(dept, 0L);
            double rate = total > 0 ? (double) allocated / total * 100 : 0;
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", total);
            stats.put("allocated", allocated);
            stats.put("rate", Math.round(rate * 100.0) / 100.0);
            
            result.put(dept, stats);
        }
        
        return result;
    }
}
