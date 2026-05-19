package com.autorepair.repository;

import com.autorepair.entity.WorkOrderPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderPartRepository extends JpaRepository<WorkOrderPart, Long> {
    List<WorkOrderPart> findByWorkOrderId(Long workOrderId);
}