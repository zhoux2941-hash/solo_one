package com.logistics.park.service;

import com.logistics.park.entity.Warehouse;
import com.logistics.park.entity.WarehouseArea;
import com.logistics.park.repository.WarehouseAreaRepository;
import com.logistics.park.repository.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WarehouseService {

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private WarehouseAreaRepository warehouseAreaRepository;

    @Transactional
    public Warehouse createWarehouse(Warehouse warehouse) {
        if (warehouseRepository.existsByCode(warehouse.getCode())) {
            throw new RuntimeException("仓库编号已存在");
        }
        validateCapacity(warehouse.getCapacity(), warehouse.getUsedCapacity());
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public Warehouse updateWarehouse(Long id, Warehouse warehouse) {
        Warehouse existing = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("仓库不存在"));
        
        if (!existing.getCode().equals(warehouse.getCode()) 
                && warehouseRepository.existsByCode(warehouse.getCode())) {
            throw new RuntimeException("仓库编号已存在");
        }
        
        validateCapacity(warehouse.getCapacity(), warehouse.getUsedCapacity());
        
        existing.setCode(warehouse.getCode());
        existing.setName(warehouse.getName());
        existing.setLocation(warehouse.getLocation());
        existing.setStorageCategory(warehouse.getStorageCategory());
        existing.setCapacity(warehouse.getCapacity());
        existing.setUsedCapacity(warehouse.getUsedCapacity());
        existing.setStatus(warehouse.getStatus());
        existing.setRemark(warehouse.getRemark());
        
        return warehouseRepository.save(existing);
    }

    @Transactional
    public void deleteWarehouse(Long id) {
        List<WarehouseArea> areas = warehouseAreaRepository.findByWarehouseId(id);
        if (!areas.isEmpty()) {
            throw new RuntimeException("该仓库下还有库区，无法删除");
        }
        warehouseRepository.deleteById(id);
    }

    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id).orElse(null);
    }

    public Page<Warehouse> getWarehouses(int page, int size, String storageCategory, String name, Warehouse.WarehouseStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        
        if (storageCategory != null && !storageCategory.isEmpty() && name != null && !name.isEmpty()) {
            return warehouseRepository.findByStorageCategoryAndNameContaining(storageCategory, name, pageable);
        } else if (storageCategory != null && !storageCategory.isEmpty()) {
            return warehouseRepository.findByStorageCategory(storageCategory, pageable);
        } else if (name != null && !name.isEmpty()) {
            return warehouseRepository.findByNameContaining(name, pageable);
        } else if (status != null) {
            return warehouseRepository.findByStatus(status, pageable);
        }
        return warehouseRepository.findAll(pageable);
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    @Transactional
    public WarehouseArea createWarehouseArea(WarehouseArea area) {
        if (warehouseAreaRepository.existsByCode(area.getCode())) {
            throw new RuntimeException("库区编号已存在");
        }
        validateCapacity(area.getCapacity(), area.getUsedCapacity());
        return warehouseAreaRepository.save(area);
    }

    @Transactional
    public WarehouseArea updateWarehouseArea(Long id, WarehouseArea area) {
        WarehouseArea existing = warehouseAreaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("库区不存在"));
        
        if (!existing.getCode().equals(area.getCode()) 
                && warehouseAreaRepository.existsByCode(area.getCode())) {
            throw new RuntimeException("库区编号已存在");
        }
        
        validateCapacity(area.getCapacity(), area.getUsedCapacity());
        
        existing.setCode(area.getCode());
        existing.setName(area.getName());
        existing.setWarehouseId(area.getWarehouseId());
        existing.setAreaCategory(area.getAreaCategory());
        existing.setShelfCount(area.getShelfCount());
        existing.setCapacity(area.getCapacity());
        existing.setUsedCapacity(area.getUsedCapacity());
        existing.setStatus(area.getStatus());
        existing.setRemark(area.getRemark());
        
        return warehouseAreaRepository.save(existing);
    }

    @Transactional
    public void deleteWarehouseArea(Long id) {
        warehouseAreaRepository.deleteById(id);
    }

    public WarehouseArea getWarehouseAreaById(Long id) {
        return warehouseAreaRepository.findById(id).orElse(null);
    }

    public Page<WarehouseArea> getWarehouseAreas(int page, int size, String areaCategory, String name, Long warehouseId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        
        if (areaCategory != null && !areaCategory.isEmpty() && name != null && !name.isEmpty()) {
            Page<WarehouseArea> result = warehouseAreaRepository.findByAreaCategoryAndNameContaining(areaCategory, name, pageable);
            fillWarehouseName(result.getContent());
            return result;
        } else if (areaCategory != null && !areaCategory.isEmpty()) {
            Page<WarehouseArea> result = warehouseAreaRepository.findByAreaCategory(areaCategory, pageable);
            fillWarehouseName(result.getContent());
            return result;
        } else if (name != null && !name.isEmpty()) {
            Page<WarehouseArea> result = warehouseAreaRepository.findByNameContaining(name, pageable);
            fillWarehouseName(result.getContent());
            return result;
        } else if (warehouseId != null) {
            Page<WarehouseArea> result = warehouseAreaRepository.findByWarehouseId(warehouseId, pageable);
            fillWarehouseName(result.getContent());
            return result;
        }
        Page<WarehouseArea> result = warehouseAreaRepository.findAll(pageable);
        fillWarehouseName(result.getContent());
        return result;
    }

    public List<WarehouseArea> getWarehouseAreasByWarehouseId(Long warehouseId) {
        List<WarehouseArea> areas = warehouseAreaRepository.findByWarehouseId(warehouseId);
        fillWarehouseName(areas);
        return areas;
    }

    private void fillWarehouseName(List<WarehouseArea> areas) {
        for (WarehouseArea area : areas) {
            Warehouse warehouse = warehouseRepository.findById(area.getWarehouseId()).orElse(null);
            if (warehouse != null) {
                area.setWarehouseName(warehouse.getName());
            }
        }
    }

    private void validateCapacity(Double capacity, Double usedCapacity) {
        if (capacity == null || capacity <= 0) {
            throw new RuntimeException("总容量必须大于0");
        }
        if (usedCapacity == null) {
            usedCapacity = 0.0;
        }
        if (usedCapacity < 0) {
            throw new RuntimeException("已用容量不能为负数");
        }
        if (usedCapacity > capacity) {
            throw new RuntimeException("已用容量不能超过总容量");
        }
    }
}
