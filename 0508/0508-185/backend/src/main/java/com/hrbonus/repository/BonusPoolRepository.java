package com.hrbonus.repository;

import com.hrbonus.entity.BonusPool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BonusPoolRepository extends JpaRepository<BonusPool, Long> {
    List<BonusPool> findByDepartmentId(Long departmentId);
    List<BonusPool> findByDepartmentIdAndIsArchived(Long departmentId, Boolean isArchived);
    Optional<BonusPool> findByDepartmentIdAndQuarterYearAndQuarterNumber(Long departmentId, Integer quarterYear, Integer quarterNumber);
    List<BonusPool> findByIsArchived(Boolean isArchived);
}
