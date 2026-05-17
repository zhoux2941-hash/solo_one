package com.logistics.park.repository;

import com.logistics.park.entity.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    boolean existsByCode(String code);
    Page<Warehouse> findByStorageCategory(String storageCategory, Pageable pageable);
    Page<Warehouse> findByNameContaining(String name, Pageable pageable);
    Page<Warehouse> findByStorageCategoryAndNameContaining(String storageCategory, String name, Pageable pageable);
    Page<Warehouse> findByStatus(Warehouse.WarehouseStatus status, Pageable pageable);
}
