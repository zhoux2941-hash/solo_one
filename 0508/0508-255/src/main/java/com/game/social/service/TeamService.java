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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private PlayerRepository playerRepository;

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public List<Team> getTeamsByStatus(String status) {
        return teamRepository.findByStatus(status);
    }

    public Optional<Team> getTeamById(Long id) {
        return teamRepository.findById(id);
    }

    public Team createTeam(Team team) {
        Optional<Team> existingTeam = teamRepository.findByName(team.getName());
        if (existingTeam.isPresent()) {
            throw new RuntimeException("Team name already exists");
        }

        team.setStatus("PENDING");
        team.setCurrentMembers(0);
        team.setCreateTime(LocalDateTime.now());
        return teamRepository.save(team);
    }

    public Team approveTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        team.setStatus("APPROVED");
        team.setApproveTime(LocalDateTime.now());
        team.setCurrentMembers(1);

        TeamMember leader = new TeamMember();
        leader.setTeamId(teamId);
        leader.setPlayerId(team.getLeaderId());
        leader.setPlayerName(team.getLeaderName());
        leader.setRole("CAPTAIN");
        leader.setJoinTime(LocalDateTime.now());
        leader.setContribution(0);
        teamMemberRepository.save(leader);

        return teamRepository.save(team);
    }

    public Team rejectTeam(Long teamId, String rejectReason) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        team.setStatus("REJECTED");
        team.setRejectReason(rejectReason);
        return teamRepository.save(team);
    }

    public Team updateTeam(Long id, Team teamDetails) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        team.setName(teamDetails.getName());
        team.setDescription(teamDetails.getDescription());
        team.setLogo(teamDetails.getLogo());
        team.setMaxMembers(teamDetails.getMaxMembers());
        return teamRepository.save(team);
    }

    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }

    public Page<Team> getTeamsWithPagination(String status, Pageable pageable) {
        if (status != null && !status.isEmpty()) {
            return teamRepository.findByStatus(status, pageable);
        }
        return teamRepository.findAll(pageable);
    }
}
