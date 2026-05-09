package com.carwash.monitor.service;

import com.carwash.monitor.dto.CheckinTrendDTO;
import com.carwash.monitor.dto.TeamContributionDTO;
import com.carwash.monitor.dto.TeamRankDTO;
import com.carwash.monitor.entity.CheckinRecord;
import com.carwash.monitor.entity.Employee;
import com.carwash.monitor.entity.Team;
import com.carwash.monitor.entity.TeamMember;
import com.carwash.monitor.repository.CheckinRecordRepository;
import com.carwash.monitor.repository.EmployeeRepository;
import com.carwash.monitor.repository.TeamMemberRepository;
import com.carwash.monitor.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private CheckinRecordRepository checkinRecordRepository;

    public List<TeamRankDTO> getTeamRanking() {
        List<Team> teams = teamRepository.findActiveTeamsOrderByPointsDesc();
        
        List<TeamRankDTO> ranking = new ArrayList<>();
        int rank = 1;

        for (Team team : teams) {
            TeamRankDTO dto = new TeamRankDTO();
            dto.setRank(rank++);
            dto.setTeamId(team.getId());
            dto.setTeamName(team.getName());
            dto.setDepartment(team.getDepartment());
            dto.setMemberCount(team.getMemberCount());
            dto.setTotalPoints(team.getTotalPoints());
            dto.setAvgPoints(team.getMemberCount() > 0 
                ? Math.round((team.getTotalPoints() * 100.0) / team.getMemberCount()) / 100.0 
                : 0.0);
            
            ranking.add(dto);
        }

        return ranking;
    }

    public List<TeamContributionDTO> getTeamContribution(String employeeNo) {
        Employee employee = employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        Optional<TeamMember> teamMemberOpt = teamMemberRepository.findByEmployeeId(employee.getId());
        
        if (teamMemberOpt.isEmpty()) {
            return Collections.emptyList();
        }

        TeamMember teamMember = teamMemberOpt.get();
        List<TeamMember> members = teamMemberRepository
                .findByTeamIdOrderByContributionPointsDesc(teamMember.getTeamId());

        int teamTotalPoints = members.stream()
                .mapToInt(TeamMember::getContributionPoints)
                .sum();

        List<TeamContributionDTO> contributions = new ArrayList<>();

        for (TeamMember member : members) {
            Employee memEmployee = employeeRepository.findById(member.getEmployeeId()).orElse(null);
            if (memEmployee != null) {
                TeamContributionDTO dto = new TeamContributionDTO();
                dto.setEmployeeNo(memEmployee.getEmployeeNo());
                dto.setEmployeeName(memEmployee.getName());
                dto.setContributionPoints(member.getContributionPoints());
                dto.setContributionRatio(teamTotalPoints > 0 
                    ? Math.round((member.getContributionPoints() * 10000.0) / teamTotalPoints) / 100.0 
                    : 0.0);
                
                contributions.add(dto);
            }
        }

        return contributions;
    }

    public List<CheckinTrendDTO> getCheckinTrend(String employeeNo) {
        Employee employee = employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        List<CheckinRecord> records = checkinRecordRepository
                .findByEmployeeIdOrderByCheckinDateDesc(employee.getId());

        LocalDate today = LocalDate.now();
        Map<LocalDate, CheckinRecord> recordMap = records.stream()
                .collect(Collectors.toMap(CheckinRecord::getCheckinDate, r -> r));

        List<CheckinTrendDTO> trend = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            CheckinTrendDTO dto = new CheckinTrendDTO();
            dto.setDate(date);

            if (recordMap.containsKey(date)) {
                CheckinRecord record = recordMap.get(date);
                dto.setIsSuccess(record.getIsSuccess());
                dto.setPointsEarned(record.getPointsEarned());
            } else {
                dto.setIsSuccess(null);
                dto.setPointsEarned(0);
            }

            trend.add(dto);
        }

        return trend;
    }

    @Transactional
    public Team createTeam(String employeeNo, String name, String description) {
        Employee employee = employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        Optional<TeamMember> existingMember = teamMemberRepository.findByEmployeeId(employee.getId());
        if (existingMember.isPresent()) {
            throw new RuntimeException("您已在一个团队中，无法创建新团队");
        }

        Team team = new Team();
        team.setName(name);
        team.setDepartment(employee.getDepartment());
        team.setDescription(description);
        team.setCreatedBy(employee.getId());
        team.setMemberCount(1);
        team = teamRepository.save(team);

        TeamMember teamMember = new TeamMember();
        teamMember.setTeamId(team.getId());
        teamMember.setEmployeeId(employee.getId());
        teamMember.setRole(TeamMember.Role.LEADER);
        teamMemberRepository.save(teamMember);

        return team;
    }

    @Transactional
    public TeamMember joinTeam(String employeeNo, Long teamId) {
        Employee employee = employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("团队不存在"));

        Optional<TeamMember> existingMember = teamMemberRepository.findByEmployeeId(employee.getId());
        if (existingMember.isPresent()) {
            throw new RuntimeException("您已在一个团队中，无法加入其他团队");
        }

        TeamMember teamMember = new TeamMember();
        teamMember.setTeamId(teamId);
        teamMember.setEmployeeId(employee.getId());
        teamMember.setRole(TeamMember.Role.MEMBER);
        teamMember = teamMemberRepository.save(teamMember);

        team.setMemberCount(team.getMemberCount() + 1);
        teamRepository.save(team);

        return teamMember;
    }

    @Transactional
    public void updateTeamContribution(Long employeeId, int points) {
        Optional<TeamMember> teamMemberOpt = teamMemberRepository.findByEmployeeId(employeeId);
        
        if (teamMemberOpt.isPresent()) {
            TeamMember teamMember = teamMemberOpt.get();
            teamMember.setContributionPoints(teamMember.getContributionPoints() + points);
            teamMemberRepository.save(teamMember);

            Team team = teamRepository.findById(teamMember.getTeamId()).orElse(null);
            if (team != null) {
                team.setTotalPoints(team.getTotalPoints() + points);
                teamRepository.save(team);
            }
        }
    }

    public Team getCurrentTeam(String employeeNo) {
        Employee employee = employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        Optional<TeamMember> teamMemberOpt = teamMemberRepository.findByEmployeeId(employee.getId());
        
        if (teamMemberOpt.isEmpty()) {
            return null;
        }

        return teamRepository.findById(teamMemberOpt.get().getTeamId()).orElse(null);
    }
}
