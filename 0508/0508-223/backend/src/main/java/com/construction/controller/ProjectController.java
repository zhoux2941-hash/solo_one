package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.Project;
import com.construction.service.ProjectService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

    @Resource
    private ProjectService projectService;

    @GetMapping("/list")
    public Result<PageResult<Project>> getProjectList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return projectService.getProjectList(pageNum, pageSize, keyword, status);
    }

    @GetMapping("/{id}")
    public Result<Project> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @PostMapping
    public Result<Project> addProject(@RequestBody Project project) {
        return projectService.addProject(project);
    }

    @PutMapping("/{id}")
    public Result<Project> updateProject(@PathVariable Long id, @RequestBody Project project) {
        return projectService.updateProject(id, project);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteProject(@PathVariable Long id) {
        return projectService.deleteProject(id);
    }

    @PutMapping("/{id}/toggle-status")
    public Result<Void> toggleProjectStatus(@PathVariable Long id) {
        return projectService.toggleProjectStatus(id);
    }

    @PutMapping("/{id}/archive")
    public Result<Void> archiveProject(@PathVariable Long id) {
        return projectService.archiveProject(id);
    }

    @GetMapping("/active")
    public Result<List<Project>> getAllActiveProjects() {
        return projectService.getAllActiveProjects();
    }
}
