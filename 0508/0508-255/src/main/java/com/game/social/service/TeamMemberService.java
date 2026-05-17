package com.game.social.service;

import com.game.social.entity.Team;
import com.game.social.entity.TeamMember;
import com.game.social.repository.TeamMemberRepository;
import com.game.social.repository.TeamRepository;
import com.game.social.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TeamMemberService {

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    public List<TeamMember> getTeamMembers(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId);
    }

    public TeamMember addTeamMember(Long teamId, Long playerId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (team.getCurrentMembers() >= team.getMaxMembers()) {
            throw new RuntimeException("Team is full");
        }

        Optional<TeamMember> existingMember = teamMemberRepository.findByTeamIdAndPlayerId(teamId, playerId);
        if (existingMember.isPresent()) {
            throw new RuntimeException("Player already in team");
        }

        String playerName = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"))
                .getNickname();

        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setPlayerId(playerId);
        member.setPlayerName(playerName);
        member.setRole("MEMBER");
        member.setJoinTime(LocalDateTime.now());
        member.setContribution(0);

        team.setCurrentMembers(team.getCurrentMembers() + 1);
        teamRepository.save(team);

        return teamMemberRepository.save(member);
    }

    public TeamMember updateMemberRole(Long teamId, Long playerId, String role) {
        TeamMember member = teamMemberRepository.findByTeamIdAndPlayerId(teamId, playerId)
                .orElseThrow(() -> new RuntimeException("Team member not found"));

        member.setRole(role);
        return teamMemberRepository.save(member);
    }

    @Transactional
    public void removeTeamMember(Long teamId, Long playerId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        teamMemberRepository.deleteByTeamIdAndPlayerId(teamId, playerId);

        team.setCurrentMembers(team.getCurrentMembers() - 1);
        teamRepository.save(team);
    }

    public List<TeamMember> getPlayerTeams(Long playerId) {
        return teamMemberRepository.findByPlayerId(playerId);
    }

    public Page<TeamMember> getTeamMembersWithPagination(Long teamId, Pageable pageable) {
        return teamMemberRepository.findByTeamId(teamId, pageable);
    }
}
