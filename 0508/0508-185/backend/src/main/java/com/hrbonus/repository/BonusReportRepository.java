package com.hrbonus.repository;

import com.hrbonus.entity.BonusReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BonusReportRepository extends JpaRepository<BonusReport, Long> {
    List<BonusReport> findByDepartmentId(Long departmentId);
    Optional<BonusReport> findByDepartmentIdAndQuarterYearAndQuarterNumber(Long departmentId, Integer quarterYear, Integer quarterNumber);
    List<BonusReport> findByQuarterYearAndQuarterNumber(Integer quarterYear, Integer quarterNumber);
}
