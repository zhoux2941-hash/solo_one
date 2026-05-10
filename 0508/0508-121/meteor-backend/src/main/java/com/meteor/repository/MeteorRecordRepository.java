package com.meteor.repository;

import com.meteor.entity.MeteorRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeteorRecordRepository extends JpaRepository<MeteorRecord, Long> {
    List<MeteorRecord> findBySessionIdOrderByObservedTimeDesc(Long sessionId);

    @Query("SELECT m FROM MeteorRecord m WHERE m.session.id = :sessionId ORDER BY m.observedTime")
    List<MeteorRecord> findBySessionIdOrderByObservedTimeAsc(@Param("sessionId") Long sessionId);

    Long countBySessionId(Long sessionId);

    @Query("SELECT m FROM MeteorRecord m WHERE m.session.meteorShowerName = :showerName")
    List<MeteorRecord> findByShowerName(@Param("showerName") String showerName);
}
