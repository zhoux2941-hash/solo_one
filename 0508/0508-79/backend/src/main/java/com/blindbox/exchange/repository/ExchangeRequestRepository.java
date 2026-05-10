package com.blindbox.exchange.repository;

import com.blindbox.exchange.entity.ExchangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExchangeRequestRepository extends JpaRepository<ExchangeRequest, Long> {
    List<ExchangeRequest> findByFromUserId(Long fromUserId);
    List<ExchangeRequest> findByToUserId(Long toUserId);
    
    @Query("SELECT r FROM ExchangeRequest r WHERE r.fromUser.id = :userId OR r.toUser.id = :userId ORDER BY r.createdAt DESC")
    List<ExchangeRequest> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT r FROM ExchangeRequest r WHERE r.fromUser.id = :userId OR r.toUser.id = :userId")
    Page<ExchangeRequest> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT r FROM ExchangeRequest r WHERE r.toUser.id = :userId AND r.status = :status ORDER BY r.createdAt DESC")
    List<ExchangeRequest> findPendingRequests(@Param("userId") Long userId, @Param("status") String status);
}
