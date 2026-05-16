package com.hrbonus.repository;

import com.hrbonus.entity.BonusVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BonusVersionRepository extends JpaRepository<BonusVersion, Long> {
    List<BonusVersion> findByAllocationIdOrderByVersionNumberDesc(Long allocationId);
    List<BonusVersion> findByBonusPoolIdOrderByVersionNumberDesc(Long bonusPoolId);
    List<BonusVersion> findByAllocationIdAndEmployeeIdOrderByVersionNumberDesc(Long allocationId, Long employeeId);
}
