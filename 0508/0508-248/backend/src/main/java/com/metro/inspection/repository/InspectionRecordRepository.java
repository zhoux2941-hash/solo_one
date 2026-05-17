package com.metro.inspection.repository;

import com.metro.inspection.entity.InspectionRecord;
import com.metro.inspection.entity.SeverityLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InspectionRecordRepository extends JpaRepository<InspectionRecord, Long> {

    List<InspectionRecord> findBySection(String section);

    List<InspectionRecord> findBySeverityLevel(SeverityLevel severityLevel);

    List<InspectionRecord> findByDamageType(String damageType);

    List<InspectionRecord> findBySectionAndSeverityLevel(String section, SeverityLevel severityLevel);

    List<InspectionRecord> findBySectionAndDamageType(String section, String damageType);

    List<InspectionRecord> findBySeverityLevelAndDamageType(SeverityLevel severityLevel, String damageType);

    List<InspectionRecord> findBySectionAndSeverityLevelAndDamageType(String section, SeverityLevel severityLevel, String damageType);

    Long countBySeverityLevel(SeverityLevel severityLevel);

    Long countBySection(String section);

    Long countBySectionAndSeverityLevel(String section, SeverityLevel severityLevel);

    @Query("SELECT COUNT(i) FROM InspectionRecord i WHERE i.inspectionDate BETWEEN :startDate AND :endDate")
    Long countByInspectionDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT i.section FROM InspectionRecord i GROUP BY i.section")
    List<String> findAllSections();
}
