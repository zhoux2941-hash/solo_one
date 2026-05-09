package com.carwash.monitor.controller;

import com.carwash.monitor.dto.*;
import com.carwash.monitor.entity.Team;
import com.carwash.monitor.entity.TeamMember;
import com.carwash.monitor.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping("/rank")
    public Result<List<TeamRankDTO>> getTeamRanking() {
        try {
            List<TeamRankDTO> ranking = teamService.getTeamRanking();
            return Result.success(ranking);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/contribution/{employeeNo}")
    public Result<List<TeamContributionDTO>> getTeamContribution(@PathVariable String employeeNo) {
        try {
            List<TeamContributionDTO> contributions = teamService.getTeamContribution(employeeNo);
            return Result.success(contributions);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/trend/{employeeNo}")
    public Result<List<CheckinTrendDTO>> getCheckinTrend(@PathVariable String employeeNo) {
        try {
            List<CheckinTrendDTO> trend = teamService.getCheckinTrend(employeeNo);
            return Result.success(trend);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/my-team/{employeeNo}")
    public Result<Team> getCurrentTeam(@PathVariable String employeeNo) {
        try {
            Team team = teamService.getCurrentTeam(employeeNo);
            return Result.success(team);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/create")
    public Result<Team> createTeam(@RequestBody CreateTeamRequestDTO request) {
        try {
            Team team = teamService.createTeam(
                request.getEmployeeNo(),
                request.getName(),
                request.getDescription()
            );
            return Result.success(team);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/join")
    public Result<TeamMember> joinTeam(@RequestBody JoinTeamRequestDTO request) {
        try {
            TeamMember teamMember = teamService.joinTeam(
                request.getEmployeeNo(),
                request.getTeamId()
            );
            return Result.success(teamMember);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
