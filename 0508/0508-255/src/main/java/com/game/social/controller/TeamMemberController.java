package com.game.social.controller;

import com.game.social.entity.TeamMember;
import com.game.social.service.TeamMemberService;
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
@RequestMapping("/api/team-members")
@CrossOrigin(origins = "*")
public class TeamMemberController {

    @Autowired
    private TeamMemberService teamMemberService;

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<TeamMember>> getTeamMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamMemberService.getTeamMembers(teamId));
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<TeamMember>> getPlayerTeams(@PathVariable Long playerId) {
        return ResponseEntity.ok(teamMemberService.getPlayerTeams(playerId));
    }

    @PostMapping
    public ResponseEntity<TeamMember> addTeamMember(@RequestBody Map<String, Long> request) {
        Long teamId = request.get("teamId");
        Long playerId = request.get("playerId");
        return ResponseEntity.ok(teamMemberService.addTeamMember(teamId, playerId));
    }

    @PutMapping("/role")
    public ResponseEntity<TeamMember> updateMemberRole(@RequestBody Map<String, Object> request) {
        Long teamId = Long.valueOf(request.get("teamId").toString());
        Long playerId = Long.valueOf(request.get("playerId").toString());
        String role = request.get("role").toString();
        return ResponseEntity.ok(teamMemberService.updateMemberRole(teamId, playerId, role));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeTeamMember(@RequestParam Long teamId, @RequestParam Long playerId) {
        teamMemberService.removeTeamMember(teamId, playerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/team/{teamId}/page")
    public ResponseEntity<Map<String, Object>> getTeamMembersWithPagination(
            @PathVariable Long teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TeamMember> memberPage = teamMemberService.getTeamMembersWithPagination(teamId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", memberPage.getContent());
        response.put("totalElements", memberPage.getTotalElements());
        response.put("totalPages", memberPage.getTotalPages());
        response.put("currentPage", memberPage.getNumber());
        response.put("pageSize", memberPage.getSize());
        response.put("hasNext", memberPage.hasNext());
        response.put("hasPrevious", memberPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }
}
