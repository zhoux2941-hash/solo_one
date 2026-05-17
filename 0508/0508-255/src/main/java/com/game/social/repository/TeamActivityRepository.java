package com.game.social.repository;

import com.game.social.entity.TeamActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamActivityRepository extends JpaRepository<TeamActivity, Long> {

    List<TeamActivity> findByTeamId(Long teamId);

    Optional<TeamActivity> findByTeamIdAndActivityDate(Long teamId, LocalDate activityDate);

    List<TeamActivity> findByTeamIdAndActivityDateBetween(Long teamId, LocalDate startDate, LocalDate endDate);
}
