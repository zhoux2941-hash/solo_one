package com.campsite.repository;

import com.campsite.entity.CampRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampRecordRepository extends JpaRepository<CampRecord, Long> {

    List<CampRecord> findByStatus(String status);

    List<CampRecord> findByCampAreaId(Long campAreaId);

    List<CampRecord> findByTeamLeaderContaining(String teamLeader);

    Page<CampRecord> findAll(Pageable pageable);

    Page<CampRecord> findByStatus(String status, Pageable pageable);
}
