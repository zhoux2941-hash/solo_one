package com.game.social.controller;

import com.game.social.entity.Team;
import com.game.social.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Team>> getTeamsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(teamService.getTeamsByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getTeamById(@PathVariable Long id) {
        return teamService.getTeamById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Team> createTeam(@RequestBody Team team) {
        return ResponseEntity.ok(teamService.createTeam(team));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Team> approveTeam(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.approveTeam(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Team> rejectTeam(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String reason = request.get("reason");
        return ResponseEntity.ok(teamService.rejectTeam(id, reason));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Team> updateTeam(@PathVariable Long id, @RequestBody Team teamDetails) {
        return ResponseEntity.ok(teamService.updateTeam(id, teamDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getTeamsWithPagination(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Team> teamPage = teamService.getTeamsWithPagination(status, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", teamPage.getContent());
        response.put("totalElements", teamPage.getTotalElements());
        response.put("totalPages", teamPage.getTotalPages());
        response.put("currentPage", teamPage.getNumber());
        response.put("pageSize", teamPage.getSize());
        response.put("hasNext", teamPage.hasNext());
        response.put("hasPrevious", teamPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }
}
