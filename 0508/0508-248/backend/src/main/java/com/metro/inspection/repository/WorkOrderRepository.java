package com.metro.inspection.repository;

import com.metro.inspection.entity.WorkOrder;
import com.metro.inspection.entity.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    Optional<WorkOrder> findByOrderNo(String orderNo);

    List<WorkOrder> findByStatus(WorkOrderStatus status);

    List<WorkOrder> findBySection(String section);
}
