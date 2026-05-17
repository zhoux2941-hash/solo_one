package com.game.social.controller;

import com.game.social.entity.TeamActivity;
import com.game.social.service.TeamActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/team-activities")
@CrossOrigin(origins = "*")
public class TeamActivityController {

    @Autowired
    private TeamActivityService teamActivityService;

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<TeamActivity>> getTeamActivities(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamActivityService.getTeamActivities(teamId));
    }

    @GetMapping("/team/{teamId}/date-range")
    public ResponseEntity<List<TeamActivity>> getTeamActivitiesByDateRange(
            @PathVariable Long teamId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(teamActivityService.getTeamActivitiesByDateRange(teamId, startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<TeamActivity> recordActivity(@RequestBody Map<String, Object> request) {
        Long teamId = Long.valueOf(request.get("teamId").toString());
        Integer activityPoints = Integer.valueOf(request.get("activityPoints").toString());
        return ResponseEntity.ok(teamActivityService.recordActivity(teamId, activityPoints));
    }

    @PutMapping("/active-members")
    public ResponseEntity<TeamActivity> updateActiveMembers(@RequestBody Map<String, Object> request) {
        Long teamId = Long.valueOf(request.get("teamId").toString());
        Integer activeMembers = Integer.valueOf(request.get("activeMembers").toString());
        return ResponseEntity.ok(teamActivityService.updateActiveMembers(teamId, activeMembers));
    }
}
