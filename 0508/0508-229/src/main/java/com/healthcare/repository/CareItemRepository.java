package com.healthcare.repository;

import com.healthcare.entity.CareItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CareItemRepository extends JpaRepository<CareItem, Long>, JpaSpecificationExecutor<CareItem> {
    boolean existsByItemCode(String itemCode);
    boolean existsByItemCodeAndIdNot(String itemCode, Long id);
    List<CareItem> findByStatusOrderByIdAsc(Integer status);
}
