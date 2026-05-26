package com.community.groupbuy.repository;

import com.community.groupbuy.entity.Commission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, Long> {
    List<Commission> findByLeaderId(Long leaderId);
    List<Commission> findByLeaderIdAndStatus(Long leaderId, String status);
    List<Commission> findByActivityId(Long activityId);

    List<Commission> findByActivityIdAndOrderId(Long activityId, Long orderId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Commission c WHERE c.leaderId = :leaderId AND c.status = 'SETTLED'")
    BigDecimal sumSettledAmountByLeaderId(@Param("leaderId") Long leaderId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Commission c WHERE c.leaderId = :leaderId AND c.status = 'PENDING'")
    BigDecimal sumPendingAmountByLeaderId(@Param("leaderId") Long leaderId);
}
