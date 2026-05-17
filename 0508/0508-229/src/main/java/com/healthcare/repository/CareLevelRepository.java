package com.healthcare.repository;

import com.healthcare.entity.CareLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CareLevelRepository extends JpaRepository<CareLevel, Long>, JpaSpecificationExecutor<CareLevel> {
    boolean existsByLevelCode(String levelCode);
    boolean existsByLevelCodeAndIdNot(String levelCode, Long id);
    List<CareLevel> findByStatusOrderBySortOrderAsc(Integer status);
}
