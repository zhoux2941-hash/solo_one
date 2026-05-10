package com.festival.volunteer.repository;

import com.festival.volunteer.entity.VolunteerApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VolunteerApplicationRepository extends JpaRepository<VolunteerApplication, Long> {
    List<VolunteerApplication> findByUserId(Long userId);
    List<VolunteerApplication> findByPositionId(Long positionId);
    List<VolunteerApplication> findByStatus(VolunteerApplication.ApplicationStatus status);
    List<VolunteerApplication> findByStatusIn(List<VolunteerApplication.ApplicationStatus> statuses);
    List<VolunteerApplication> findByPositionIdAndStatusIn(Long positionId, List<VolunteerApplication.ApplicationStatus> statuses);
    boolean existsByUserIdAndPositionId(Long userId, Long positionId);
}
