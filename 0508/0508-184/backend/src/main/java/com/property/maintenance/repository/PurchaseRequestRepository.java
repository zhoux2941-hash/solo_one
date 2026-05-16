package com.property.maintenance.repository;

import com.property.maintenance.entity.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

    List<PurchaseRequest> findByStatus(String status);

    List<PurchaseRequest> findBySparePartId(Long sparePartId);
}
