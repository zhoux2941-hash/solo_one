package com.asset.repository;

import com.asset.model.Asset;
import com.asset.model.AssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByStatus(AssetStatus status);

    Page<Asset> findByStatus(AssetStatus status, Pageable pageable);

    List<Asset> findByStatusAndHolderDepartment(AssetStatus status, String department);

    @Query("SELECT a FROM Asset a WHERE a.status = 'ALLOCATED' AND a.allocateDate <= :thresholdDate")
    List<Asset> findOverdueAssets(LocalDate thresholdDate);

    @Query("SELECT a FROM Asset a WHERE a.status = 'ALLOCATED' AND a.allocateDate <= :thresholdDate")
    Page<Asset> findOverdueAssets(LocalDate thresholdDate, Pageable pageable);

    @Query("SELECT DISTINCT a.holderDepartment FROM Asset a WHERE a.holderDepartment IS NOT NULL")
    List<String> findAllDepartments();

    @Query("SELECT a.holderDepartment, COUNT(a) FROM Asset a WHERE a.status = 'ALLOCATED' GROUP BY a.holderDepartment")
    List<Object[]> countAllocatedByDepartment();

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.holderDepartment = :department")
    Long countTotalByDepartment(String department);

    boolean existsByAssetNumber(String assetNumber);
}
