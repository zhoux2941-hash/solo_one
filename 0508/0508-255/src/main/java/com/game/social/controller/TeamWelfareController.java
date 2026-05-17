package com.game.social.controller;

import com.game.social.entity.TeamWelfare;
import com.game.social.service.TeamWelfareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team-welfares")
@CrossOrigin(origins = "*")
public class TeamWelfareController {

    @Autowired
    private TeamWelfareService teamWelfareService;

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<TeamWelfare>> getTeamWelfares(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamWelfareService.getTeamWelfares(teamId));
    }

    @GetMapping("/team/{teamId}/enabled")
    public ResponseEntity<List<TeamWelfare>> getEnabledTeamWelfares(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamWelfareService.getEnabledTeamWelfares(teamId));
    }

    @PostMapping
    public ResponseEntity<TeamWelfare> createWelfare(@RequestBody TeamWelfare welfare) {
        return ResponseEntity.ok(teamWelfareService.createWelfare(welfare));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamWelfare> updateWelfare(@PathVariable Long id, @RequestBody TeamWelfare welfareDetails) {
        return ResponseEntity.ok(teamWelfareService.updateWelfare(id, welfareDetails));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<TeamWelfare> toggleWelfareStatus(@PathVariable Long id) {
        return ResponseEntity.ok(teamWelfareService.toggleWelfareStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWelfare(@PathVariable Long id) {
        teamWelfareService.deleteWelfare(id);
        return ResponseEntity.ok().build();
    }
}
