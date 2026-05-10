package com.crew.repository;

import com.crew.entity.Notice;
import com.crew.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    
    List<Notice> findByNoticeDateOrderByStartTimeAsc(LocalDate date);
    
    @Query("SELECT n FROM Notice n JOIN n.actors a WHERE a.id = :actorId AND n.noticeDate = :date ORDER BY n.startTime ASC")
    List<Notice> findByActorAndDate(@Param("actorId") Long actorId, @Param("date") LocalDate date);
    
    @Query("SELECT n FROM Notice n JOIN n.actors a WHERE a.id = :actorId ORDER BY n.noticeDate ASC, n.startTime ASC")
    List<Notice> findAllByActor(@Param("actorId") Long actorId);
    
    @Query("SELECT n FROM Notice n JOIN n.actors a WHERE a.id = :actorId AND n.noticeDate = :date AND n.id != :excludeId")
    List<Notice> findByActorAndDateExcludingId(
            @Param("actorId") Long actorId, 
            @Param("date") LocalDate date, 
            @Param("excludeId") Long excludeId);
}