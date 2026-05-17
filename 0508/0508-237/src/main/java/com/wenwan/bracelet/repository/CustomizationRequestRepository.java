package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.CustomizationRequest;
import com.wenwan.bracelet.entity.CustomizationRequest.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomizationRequestRepository extends JpaRepository<CustomizationRequest, Long> {
    
    List<CustomizationRequest> findByCustomerId(Long customerId);
    
    List<CustomizationRequest> findByAssignedCraftsmanId(Long craftsmanId);
    
    List<CustomizationRequest> findByStatus(RequestStatus status);
    
    List<CustomizationRequest> findByStatusIn(List<RequestStatus> statuses);
}
