package com.hrbonus.repository;

import com.hrbonus.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, Long> {
    List<Appeal> findByAllocationId(Long allocationId);
    List<Appeal> findByEmployeeId(Long employeeId);
    List<Appeal> findByStatus(Appeal.AppealStatus status);
}
