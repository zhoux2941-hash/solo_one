package com.game.social.repository;

import com.game.social.entity.TeamMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findByTeamId(Long teamId);

    Page<TeamMember> findByTeamId(Long teamId, Pageable pageable);

    Optional<TeamMember> findByTeamIdAndPlayerId(Long teamId, Long playerId);

    List<TeamMember> findByPlayerId(Long playerId);

    void deleteByTeamIdAndPlayerId(Long teamId, Long playerId);
}
