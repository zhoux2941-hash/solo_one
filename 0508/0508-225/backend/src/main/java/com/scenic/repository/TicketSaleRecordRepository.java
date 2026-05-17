package com.scenic.repository;

import com.scenic.entity.TicketSaleRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketSaleRecordRepository extends JpaRepository<TicketSaleRecord, Long> {

    Optional<TicketSaleRecord> findByOrderNo(String orderNo);

    @Query("SELECT t FROM TicketSaleRecord t WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR t.orderNo LIKE %:keyword% OR t.buyerName LIKE %:keyword% OR t.buyerPhone LIKE %:keyword%) AND " +
           "(:ticketTypeId IS NULL OR t.ticketType.id = :ticketTypeId)")
    Page<TicketSaleRecord> findByConditions(
            @Param("keyword") String keyword,
            @Param("ticketTypeId") Long ticketTypeId,
            Pageable pageable);

    List<TicketSaleRecord> findByCreateTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
}
