package com.charging.repository;

import com.charging.entity.FaultReport;
import com.charging.entity.FaultReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaultReportRepository extends JpaRepository<FaultReport, Long> {
    List<FaultReport> findByPileId(Long pileId);
    List<FaultReport> findByReporterId(Long reporterId);
    List<FaultReport> findByStatus(FaultReportStatus status);
    List<FaultReport> findByPileIdAndStatus(Long pileId, FaultReportStatus status);
}
