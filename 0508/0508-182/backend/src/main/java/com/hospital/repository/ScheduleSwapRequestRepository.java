package com.hospital.repository;

import com.hospital.entity.ScheduleSwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScheduleSwapRequestRepository extends JpaRepository<ScheduleSwapRequest, Long> {
    List<ScheduleSwapRequest> findByStatus(ScheduleSwapRequest.SwapStatus status);
}
