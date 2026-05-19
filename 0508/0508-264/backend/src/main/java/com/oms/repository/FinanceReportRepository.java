package com.oms.repository;

import com.oms.entity.FinanceReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.stream.Stream;

@Repository
public interface FinanceReportRepository extends JpaRepository<FinanceReport, Long> {

    /**
     * 流式查询 - 用于大数据量导出，避免一次性加载全部到内存
     * 使用Stream方式逐条处理，内存占用极低
     */
    @Query("SELECT f FROM FinanceReport f WHERE f.tenantId = :tenantId AND f.reportDate BETWEEN :startDate AND :endDate ORDER BY f.reportDate")
    Stream<FinanceReport> streamByTenantIdAndDateRange(Long tenantId, LocalDate startDate, LocalDate endDate);

    /**
     * 分页查询 - 用于前端分页展示
     */
    Page<FinanceReport> findByTenantIdAndReportDateBetween(Long tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * 统计数据量 - 用于导出前警告
     */
    long countByTenantIdAndReportDateBetween(Long tenantId, LocalDate startDate, LocalDate endDate);
}
