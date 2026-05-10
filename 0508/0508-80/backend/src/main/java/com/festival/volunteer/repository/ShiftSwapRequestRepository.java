package com.festival.volunteer.repository;

import com.festival.volunteer.entity.ShiftSwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftSwapRequestRepository extends JpaRepository<ShiftSwapRequest, Long> {
    
    List<ShiftSwapRequest> findByFromVolunteerIdOrderByCreatedAtDesc(Long fromVolunteerId);
    
    List<ShiftSwapRequest> findByToVolunteerIdOrderByCreatedAtDesc(Long toVolunteerId);
    
    List<ShiftSwapRequest> findByScheduleId(Long scheduleId);
    
    List<ShiftSwapRequest> findByStatusOrderByCreatedAtDesc(ShiftSwapRequest.SwapStatus status);
    
    boolean existsByScheduleIdAndStatusIn(Long scheduleId, List<ShiftSwapRequest.SwapStatus> statuses);
}
