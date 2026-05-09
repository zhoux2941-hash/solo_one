package com.carwash.monitor.repository;

import com.carwash.monitor.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findAllByOrderByTotalPointsDesc();
    
    @Query("SELECT t FROM Team t WHERE t.memberCount > 0 ORDER BY t.totalPoints DESC")
    List<Team> findActiveTeamsOrderByPointsDesc();
}
