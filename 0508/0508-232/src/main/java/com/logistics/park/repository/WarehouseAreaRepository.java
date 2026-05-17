package com.logistics.park.repository;

import com.logistics.park.entity.WarehouseArea;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseAreaRepository extends JpaRepository<WarehouseArea, Long> {
    boolean existsByCode(String code);
    List<WarehouseArea> findByWarehouseId(Long warehouseId);
    Page<WarehouseArea> findByAreaCategory(String areaCategory, Pageable pageable);
    Page<WarehouseArea> findByNameContaining(String name, Pageable pageable);
    Page<WarehouseArea> findByWarehouseId(Long warehouseId, Pageable pageable);
    Page<WarehouseArea> findByAreaCategoryAndNameContaining(String areaCategory, String name, Pageable pageable);
}
