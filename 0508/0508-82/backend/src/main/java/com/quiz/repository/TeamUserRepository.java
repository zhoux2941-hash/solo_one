package com.quiz.repository;

import com.quiz.entity.TeamUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamUserRepository extends JpaRepository<TeamUser, Long> {
    List<TeamUser> findByUserId(Long userId);
    List<TeamUser> findByTeamId(Long teamId);
}
