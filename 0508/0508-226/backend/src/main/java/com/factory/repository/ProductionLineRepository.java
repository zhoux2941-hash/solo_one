package com.factory.repository;

import com.factory.entity.ProductionLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionLineRepository extends JpaRepository<ProductionLine, Long> {
    Optional<ProductionLine> findByLineCode(String lineCode);
    boolean existsByLineCode(String lineCode);
    List<ProductionLine> findByWorkshopId(Long workshopId);
    Page<ProductionLine> findByLineNameContaining(String lineName, Pageable pageable);
}