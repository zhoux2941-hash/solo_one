package com.game.social.repository;

import com.game.social.entity.TeamWelfare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamWelfareRepository extends JpaRepository<TeamWelfare, Long> {

    List<TeamWelfare> findByTeamId(Long teamId);

    List<TeamWelfare> findByTeamIdAndEnabled(Long teamId, Boolean enabled);
}
