package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.Team;
import com.factory.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/team")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping("/page")
    public Result<Page<Team>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return teamService.findAll(page, size, keyword);
    }

    @GetMapping("/line/{lineId}")
    public Result<List<Team>> findByLineId(@PathVariable Long lineId) {
        return teamService.findByLineId(lineId);
    }

    @GetMapping("/{id}")
    public Result<Team> findById(@PathVariable Long id) {
        return teamService.findById(id);
    }

    @PostMapping
    public Result<Team> save(@RequestBody Team team) {
        return teamService.save(team);
    }

    @PutMapping("/{id}")
    public Result<Team> update(@PathVariable Long id, @RequestBody Team team) {
        return teamService.update(id, team);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return teamService.delete(id);
    }
}