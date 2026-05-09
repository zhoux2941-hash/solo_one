package com.carwash.monitor.repository;

import com.carwash.monitor.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamIdOrderByContributionPointsDesc(Long teamId);
    
    Optional<TeamMember> findByEmployeeId(Long employeeId);
    
    List<TeamMember> findByEmployeeIdOrderByJoinedAtDesc(Long employeeId);
    
    long countByTeamId(Long teamId);
}
