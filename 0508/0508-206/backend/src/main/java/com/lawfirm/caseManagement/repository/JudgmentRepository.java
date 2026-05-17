package com.lawfirm.caseManagement.repository;

import com.lawfirm.caseManagement.entity.Judgment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JudgmentRepository extends JpaRepository<Judgment, Long> {

    List<Judgment> findByCaseEntityId(Long caseId);

    List<Judgment> findByCaseEntityIdOrderByJudgmentDateDesc(Long caseId);
}
