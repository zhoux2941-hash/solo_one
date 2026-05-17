package com.lawfirm.caseManagement.repository;

import com.lawfirm.caseManagement.entity.Hearing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HearingRepository extends JpaRepository<Hearing, Long> {

    List<Hearing> findByCaseEntityId(Long caseId);

    List<Hearing> findByCaseEntityIdOrderByHearingDateDesc(Long caseId);
}
