package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.LaborTeam;
import com.construction.service.LaborTeamService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/labor/team")
public class LaborTeamController {

    @Resource
    private LaborTeamService laborTeamService;

    @GetMapping("/list")
    public Result<PageResult<LaborTeam>> getTeamList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return laborTeamService.getTeamList(pageNum, pageSize, projectId, keyword, status);
    }

    @GetMapping("/{id}")
    public Result<LaborTeam> getTeamById(@PathVariable Long id) {
        return laborTeamService.getTeamById(id);
    }

    @GetMapping("/active")
    public Result<List<LaborTeam>> getAllActiveTeams(@RequestParam Long projectId) {
        return laborTeamService.getAllActiveTeams(projectId);
    }

    @PostMapping
    public Result<LaborTeam> addTeam(@RequestBody LaborTeam team) {
        return laborTeamService.addTeam(team);
    }

    @PutMapping("/{id}")
    public Result<LaborTeam> updateTeam(@PathVariable Long id, @RequestBody LaborTeam team) {
        return laborTeamService.updateTeam(id, team);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteTeam(@PathVariable Long id) {
        return laborTeamService.deleteTeam(id);
    }

    @PutMapping("/{id}/toggle-status")
    public Result<Void> toggleTeamStatus(@PathVariable Long id) {
        return laborTeamService.toggleTeamStatus(id);
    }
}
