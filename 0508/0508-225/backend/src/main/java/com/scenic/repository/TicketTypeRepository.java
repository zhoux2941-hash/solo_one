package com.scenic.repository;

import com.scenic.entity.TicketType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {

    Optional<TicketType> findByTypeCode(String typeCode);

    List<TicketType> findByStatus(String status);

    @Query("SELECT t FROM TicketType t WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR t.typeName LIKE %:keyword% OR t.typeCode LIKE %:keyword%) AND " +
           "(:ticketCategory IS NULL OR :ticketCategory = '' OR t.ticketCategory = :ticketCategory) AND " +
           "(:status IS NULL OR :status = '' OR t.status = :status)")
    Page<TicketType> findByConditions(
            @Param("keyword") String keyword,
            @Param("ticketCategory") String ticketCategory,
            @Param("status") String status,
            Pageable pageable);

    boolean existsByTypeCode(String typeCode);
}
