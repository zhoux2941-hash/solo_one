package com.scenic.repository;

import com.scenic.entity.Ticket;
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
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR t.ticketCode LIKE %:keyword% OR t.buyerName LIKE %:keyword% OR t.buyerPhone LIKE %:keyword%) AND " +
           "(:status IS NULL OR :status = '' OR t.status = :status) AND " +
           "(:ticketTypeId IS NULL OR t.ticketType.id = :ticketTypeId)")
    Page<Ticket> findByConditions(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("ticketTypeId") Long ticketTypeId,
            Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.status = :status AND t.createTime BETWEEN :startTime AND :endTime")
    List<Ticket> findByStatusAndCreateTimeBetween(
            @Param("status") String status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT t.ticketType.ticketCategory, COUNT(t) FROM Ticket t WHERE t.status = :status GROUP BY t.ticketType.ticketCategory")
    List<Object[]> countByStatusGroupByCategory(@Param("status") String status);

    boolean existsByTicketCode(String ticketCode);
}
