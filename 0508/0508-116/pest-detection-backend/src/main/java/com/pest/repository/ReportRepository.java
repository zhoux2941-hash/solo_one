package com.pest.repository;

import com.pest.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByFarmerIdOrderByReportTimeDesc(Long farmerId);
    List<Report> findByStatusOrderByReportTimeDesc(Report.Status status);
    List<Report> findTop10ByOrderByReportTimeDesc();

    @Query("SELECT r.cropType, COUNT(r) FROM Report r GROUP BY r.cropType ORDER BY COUNT(r) DESC")
    List<Object[]> countByCropType();

    @Query("SELECT r.pestName, COUNT(r) FROM Report r WHERE r.pestName IS NOT NULL GROUP BY r.pestName ORDER BY COUNT(r) DESC")
    List<Object[]> countByPestName();
}