package com.construction.progress.service;

import com.construction.progress.constant.ProgressConstants;
import com.construction.progress.dto.ProjectDTO;
import com.construction.progress.entity.Project;
import com.construction.progress.entity.ProjectStage;
import com.construction.progress.repository.ProjectRepository;
import com.construction.progress.repository.ProjectStageRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectStageRepository projectStageRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public ProjectService(ProjectRepository projectRepository,
                         ProjectStageRepository projectStageRepository,
                         RedisTemplate<String, Object> redisTemplate) {
        this.projectRepository = projectRepository;
        this.projectStageRepository = projectStageRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Map<String, Object> createProject(Long ownerId, ProjectDTO projectDTO) {
        Project project = new Project();
        project.setOwnerId(ownerId);
        project.setOwnerName(projectDTO.getOwnerName());
        project.setAddress(projectDTO.getAddress());
        project.setArea(projectDTO.getArea());
        project.setCurrentStage(0);
        project.setStatus(Project.Status.ACTIVE);
        
        Project savedProject = projectRepository.save(project);
        
        for (int i = 0; i < ProgressConstants.TOTAL_STAGES; i++) {
            ProjectStage stage = new ProjectStage();
            stage.setProjectId(savedProject.getId());
            stage.setStageIndex(i);
            stage.setStageName(ProgressConstants.getStageName(i));
            stage.setProgress(BigDecimal.ZERO);
            stage.setIsCompleted(false);
            projectStageRepository.save(stage);
        }
        
        updateProjectCache(savedProject.getId());
        
        return convertToProjectDetail(savedProject);
    }

    public List<Map<String, Object>> getAllProjects(Long userId, String userRole) {
        List<Project> projects;
        if ("OWNER".equals(userRole)) {
            projects = projectRepository.findByOwnerId(userId);
        } else {
            projects = projectRepository.findByStatus(Project.Status.ACTIVE);
        }
        return projects.stream()
                .map(this::convertToProjectSummary)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getProjectDetail(Long projectId) {
        Map<String, Object> cached = getProjectFromCache(projectId);
        if (cached != null) {
            return cached;
        }
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        
        Map<String, Object> detail = convertToProjectDetail(project);
        cacheProject(projectId, detail);
        return detail;
    }

    @Transactional
    public Map<String, Object> updateProjectProgress(Long projectId, Integer stageIndex, BigDecimal progress) {
        ProjectStage stage = projectStageRepository.findByProjectIdAndStageIndex(projectId, stageIndex)
                .orElseThrow(() -> new RuntimeException("工序不存在"));
        
        BigDecimal newProgress = stage.getProgress().add(progress);
        if (newProgress.compareTo(BigDecimal.valueOf(100)) > 0) {
            newProgress = BigDecimal.valueOf(100);
        }
        
        stage.setProgress(newProgress);
        
        if (newProgress.compareTo(BigDecimal.valueOf(100)) >= 0 && !stage.getIsCompleted()) {
            stage.setIsCompleted(true);
            stage.setCompletedTime(LocalDateTime.now());
            
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("项目不存在"));
            
            if (stageIndex + 1 < ProgressConstants.TOTAL_STAGES) {
                project.setCurrentStage(stageIndex + 1);
                
                ProjectStage nextStage = projectStageRepository.findByProjectIdAndStageIndex(projectId, stageIndex + 1)
                        .orElseThrow(() -> new RuntimeException("下一工序不存在"));
                if (nextStage.getStartTime() == null) {
                    nextStage.setStartTime(LocalDateTime.now());
                    projectStageRepository.save(nextStage);
                }
            } else {
                project.setStatus(Project.Status.COMPLETED);
            }
            projectRepository.save(project);
        }
        
        projectStageRepository.save(stage);
        
        updateProjectCache(projectId);
        
        return getProjectDetail(projectId);
    }

    public List<Map<String, Object>> getProjectStages(Long projectId) {
        List<ProjectStage> stages = projectStageRepository.findByProjectIdOrderByStageIndex(projectId);
        return stages.stream()
                .map(this::convertToStageInfo)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updatePlannedDays(Long projectId, Integer stageIndex, Integer plannedDays) {
        ProjectStage stage = projectStageRepository.findByProjectIdAndStageIndex(projectId, stageIndex)
                .orElseThrow(() -> new RuntimeException("工序不存在"));
        
        stage.setPlannedDays(plannedDays);
        projectStageRepository.save(stage);
        
        updateProjectCache(projectId);
        
        return convertToStageInfo(stage);
    }

    @Transactional
    public Map<String, Object> startStage(Long projectId, Integer stageIndex) {
        ProjectStage stage = projectStageRepository.findByProjectIdAndStageIndex(projectId, stageIndex)
                .orElseThrow(() -> new RuntimeException("工序不存在"));
        
        if (stage.getStartTime() == null) {
            stage.setStartTime(LocalDateTime.now());
            projectStageRepository.save(stage);
            updateProjectCache(projectId);
        }
        
        return convertToStageInfo(stage);
    }

    private Map<String, Object> convertToProjectSummary(Project project) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", project.getId());
        summary.put("ownerName", project.getOwnerName());
        summary.put("address", project.getAddress());
        summary.put("area", project.getArea());
        summary.put("currentStage", project.getCurrentStage());
        summary.put("currentStageName", ProgressConstants.getStageName(project.getCurrentStage()));
        summary.put("status", project.getStatus().name());
        summary.put("createTime", project.getCreateTime());
        return summary;
    }

    private Map<String, Object> convertToProjectDetail(Project project) {
        Map<String, Object> detail = convertToProjectSummary(project);
        
        List<Map<String, Object>> stages = getProjectStages(project.getId());
        detail.put("stages", stages);
        
        BigDecimal totalProgress = BigDecimal.ZERO;
        for (Map<String, Object> stage : stages) {
            totalProgress = totalProgress.add((BigDecimal) stage.get("progress"));
        }
        detail.put("totalProgress", totalProgress.divide(
                BigDecimal.valueOf(ProgressConstants.TOTAL_STAGES), 2, BigDecimal.ROUND_HALF_UP));
        
        return detail;
    }

    private Map<String, Object> convertToStageInfo(ProjectStage stage) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("stageIndex", stage.getStageIndex());
        info.put("stageName", stage.getStageName());
        info.put("progress", stage.getProgress());
        info.put("isCompleted", stage.getIsCompleted());
        info.put("completedTime", stage.getCompletedTime());
        info.put("plannedDays", stage.getPlannedDays());
        info.put("startTime", stage.getStartTime());
        info.put("lastWarningTime", stage.getLastWarningTime());
        return info;
    }

    private void updateProjectCache(Long projectId) {
        String cacheKey = ProgressConstants.REDIS_KEY_PROJECT_STATUS + projectId;
        redisTemplate.delete(cacheKey);
    }

    private void cacheProject(Long projectId, Map<String, Object> projectData) {
        String cacheKey = ProgressConstants.REDIS_KEY_PROJECT_STATUS + projectId;
        redisTemplate.opsForValue().set(cacheKey, projectData, 
                ProgressConstants.REDIS_EXPIRE_SECONDS, TimeUnit.SECONDS);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getProjectFromCache(Long projectId) {
        String cacheKey = ProgressConstants.REDIS_KEY_PROJECT_STATUS + projectId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        return cached != null ? (Map<String, Object>) cached : null;
    }
}
