package com.lawfirm.caseManagement.repository;

import com.lawfirm.caseManagement.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {

    List<Case> findByLawyer(String lawyer);

    @Query("SELECT c FROM Case c WHERE c.statuteOfLimitationsDeadline BETWEEN :startDate AND :endDate")
    List<Case> findCasesWithUpcomingDeadline(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT c FROM Case c WHERE c.statuteOfLimitationsDeadline <= :deadline")
    List<Case> findCasesExpiringBefore(@Param("deadline") LocalDate deadline);

    @Query("SELECT c.lawyer, COUNT(c) FROM Case c GROUP BY c.lawyer")
    List<Object[]> countCasesByLawyer();

    boolean existsByCaseNumber(String caseNumber);

    List<Case> findAllByOrderByStatuteOfLimitationsDeadlineAsc();
}
