package com.community.buying.repository;

import com.community.buying.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    List<Refund> findByUserIdOrderByCreateTimeDesc(Long userId);
    List<Refund> findByStatus(Integer status);
}