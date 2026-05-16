package com.sales.repository;

import com.sales.entity.FollowUpRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FollowUpRecordRepository extends JpaRepository<FollowUpRecord, Long> {

    List<FollowUpRecord> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<FollowUpRecord> findBySalesperson(String salesperson);

    @Query("SELECT f FROM FollowUpRecord f WHERE f.customer.id = :customerId AND f.createdAt >= :since")
    List<FollowUpRecord> findByCustomerIdAndCreatedAtAfter(@Param("customerId") Long customerId, @Param("since") LocalDateTime since);

    @Query("SELECT f FROM FollowUpRecord f WHERE f.createdAt >= :since ORDER BY f.createdAt DESC")
    List<FollowUpRecord> findAllByCreatedAtAfter(@Param("since") LocalDateTime since);
}