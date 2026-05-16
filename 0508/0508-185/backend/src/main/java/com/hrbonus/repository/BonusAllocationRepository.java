package com.hrbonus.repository;

import com.hrbonus.entity.BonusAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BonusAllocationRepository extends JpaRepository<BonusAllocation, Long> {
    List<BonusAllocation> findByBonusPoolId(Long bonusPoolId);
    List<BonusAllocation> findByEmployeeId(Long employeeId);
    Optional<BonusAllocation> findByBonusPoolIdAndEmployeeId(Long bonusPoolId, Long employeeId);
    List<BonusAllocation> findByBonusPoolIdAndIsFrozen(Long bonusPoolId, Boolean isFrozen);
}
