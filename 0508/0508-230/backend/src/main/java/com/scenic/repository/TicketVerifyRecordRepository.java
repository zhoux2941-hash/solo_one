package com.scenic.repository;

import com.scenic.entity.TicketVerifyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketVerifyRecordRepository extends JpaRepository<TicketVerifyRecord, Long> {

    List<TicketVerifyRecord> findByTicketCode(String ticketCode);

    @Query("SELECT t FROM TicketVerifyRecord t WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR t.ticketCode LIKE %:keyword% OR t.visitorName LIKE %:keyword% OR t.visitorPhone LIKE %:keyword%) AND " +
           "(:ticketTypeId IS NULL OR t.ticketType.id = :ticketTypeId)")
    Page<TicketVerifyRecord> findByConditions(
            @Param("keyword") String keyword,
            @Param("ticketTypeId") Long ticketTypeId,
            Pageable pageable);

    List<TicketVerifyRecord> findByCreateTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT t.ticketType.ticketCategory, COUNT(t) FROM TicketVerifyRecord t WHERE t.createTime BETWEEN :startTime AND :endTime GROUP BY t.ticketType.ticketCategory")
    List<Object[]> countByCreateTimeBetweenGroupByCategory(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    long countByCreateTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
}
