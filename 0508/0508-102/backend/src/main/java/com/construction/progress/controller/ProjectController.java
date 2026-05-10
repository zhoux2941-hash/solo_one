package com.construction.progress.controller;

import com.construction.progress.dto.ApiResponse;
import com.construction.progress.dto.ProjectDTO;
import com.construction.progress.dto.UpdatePlannedDaysDTO;
import com.construction.progress.security.JwtTokenProvider;
import com.construction.progress.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final JwtTokenProvider jwtTokenProvider;

    public ProjectController(ProjectService projectService, JwtTokenProvider jwtTokenProvider) {
        this.projectService = projectService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createProject(
            @AuthenticationPrincipal Long ownerId,
            @RequestHeader(value = "Authorization") String authorization,
            @Valid @RequestBody ProjectDTO projectDTO) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            if (!"OWNER".equals(role)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只有房主可以创建项目"));
            }
            
            Map<String, Object> result = projectService.createProject(ownerId, projectDTO);
            return ResponseEntity.ok(ApiResponse.success("项目创建成功", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllProjects(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(value = "Authorization") String authorization) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            List<Map<String, Object>> projects = projectService.getAllProjects(userId, role);
            return ResponseEntity.ok(ApiResponse.success(projects));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProjectDetail(@PathVariable Long projectId) {
        try {
            Map<String, Object> result = projectService.getProjectDetail(projectId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{projectId}/stages")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProjectStages(@PathVariable Long projectId) {
        try {
            List<Map<String, Object>> stages = projectService.getProjectStages(projectId);
            return ResponseEntity.ok(ApiResponse.success(stages));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/stages/planned-days")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePlannedDays(
            @AuthenticationPrincipal Long userId,
            @RequestHeader(value = "Authorization") String authorization,
            @Valid @RequestBody UpdatePlannedDaysDTO dto) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            if (!"OWNER".equals(role)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只有房主可以设置计划天数"));
            }
            
            Map<String, Object> result = projectService.updatePlannedDays(
                    dto.getProjectId(), 
                    dto.getStageIndex(), 
                    dto.getPlannedDays()
            );
            return ResponseEntity.ok(ApiResponse.success("计划天数更新成功", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{projectId}/stages/{stageIndex}/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startStage(
            @PathVariable Long projectId,
            @PathVariable Integer stageIndex,
            @RequestHeader(value = "Authorization") String authorization) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            Map<String, Object> result = projectService.startStage(projectId, stageIndex);
            return ResponseEntity.ok(ApiResponse.success("工序开始时间已设置", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
