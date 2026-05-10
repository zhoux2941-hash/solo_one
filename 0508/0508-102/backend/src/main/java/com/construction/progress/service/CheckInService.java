package com.construction.progress.service;

import com.construction.progress.constant.ProgressConstants;
import com.construction.progress.dto.CheckInDTO;
import com.construction.progress.entity.CheckIn;
import com.construction.progress.entity.Project;
import com.construction.progress.entity.ProjectStage;
import com.construction.progress.repository.CheckInRepository;
import com.construction.progress.repository.ProjectStageRepository;
import com.construction.progress.repository.ProjectRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final ProjectStageRepository projectStageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final RedisTemplate<String, Object> redisTemplate;

    public CheckInService(CheckInRepository checkInRepository,
                         ProjectStageRepository projectStageRepository,
                         ProjectRepository projectRepository,
                         ProjectService projectService,
                         RedisTemplate<String, Object> redisTemplate) {
        this.checkInRepository = checkInRepository;
        this.projectStageRepository = projectStageRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Map<String, Object> createCheckIn(Long workerId, CheckInDTO checkInDTO) {
        Project project = projectRepository.findById(checkInDTO.getProjectId())
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        
        if (Project.Status.COMPLETED.equals(project.getStatus())) {
            throw new RuntimeException("项目已完成，无法打卡");
        }
        
        List<ProjectStage> allStages = projectStageRepository.findByProjectIdOrderByStageIndex(checkInDTO.getProjectId());
        
        ProjectStage currentStageEntity = allStages.stream()
                .filter(s -> !s.getIsCompleted())
                .findFirst()
                .orElse(null);
        
        if (currentStageEntity == null) {
            throw new RuntimeException("所有工序已完成");
        }
        
        Integer currentStageIndex = currentStageEntity.getStageIndex();
        
        BigDecimal remainingProgress = BigDecimal.valueOf(100).subtract(currentStageEntity.getProgress());
        BigDecimal dailyProgress = checkInDTO.getDailyProgress();
        if (dailyProgress.compareTo(remainingProgress) > 0) {
            dailyProgress = remainingProgress;
        }
        
        CheckIn checkIn = new CheckIn();
        checkIn.setProjectId(checkInDTO.getProjectId());
        checkIn.setWorkerId(workerId);
        checkIn.setStageIndex(currentStageIndex);
        checkIn.setStageName(ProgressConstants.getStageName(currentStageIndex));
        checkIn.setDailyProgress(dailyProgress);
        checkIn.setDescription(checkInDTO.getDescription());
        checkIn.setImageUrl(checkInDTO.getImageUrl());
        
        CheckIn savedCheckIn = checkInRepository.save(checkIn);
        
        projectService.updateProjectProgress(checkInDTO.getProjectId(), currentStageIndex, dailyProgress);
        
        updateTimelineCache(checkInDTO.getProjectId());
        
        return convertToCheckInDetail(savedCheckIn);
    }

    public List<Map<String, Object>> getProjectTimeline(Long projectId) {
        List<Map<String, Object>> cached = getTimelineFromCache(projectId);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }
        
        List<CheckIn> checkIns = checkInRepository.findByProjectIdOrderByCreateTimeDesc(projectId);
        List<Map<String, Object>> timeline = checkIns.stream()
                .map(this::convertToCheckInDetail)
                .collect(Collectors.toList());
        
        cacheTimeline(projectId, timeline);
        return timeline;
    }

    public List<Map<String, Object>> getWorkerCheckIns(Long workerId) {
        List<CheckIn> checkIns = checkInRepository.findByWorkerIdOrderByCreateTimeDesc(workerId);
        return checkIns.stream()
                .map(this::convertToCheckInDetail)
                .collect(Collectors.toList());
    }

    private Map<String, Object> convertToCheckInDetail(CheckIn checkIn) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("id", checkIn.getId());
        detail.put("projectId", checkIn.getProjectId());
        detail.put("workerId", checkIn.getWorkerId());
        detail.put("stageIndex", checkIn.getStageIndex());
        detail.put("stageName", checkIn.getStageName());
        detail.put("dailyProgress", checkIn.getDailyProgress());
        detail.put("description", checkIn.getDescription());
        detail.put("imageUrl", checkIn.getImageUrl());
        detail.put("createTime", checkIn.getCreateTime());
        return detail;
    }

    private void updateTimelineCache(Long projectId) {
        String cacheKey = ProgressConstants.REDIS_KEY_CHECKIN_TIMELINE + projectId;
        redisTemplate.delete(cacheKey);
    }

    private void cacheTimeline(Long projectId, List<Map<String, Object>> timeline) {
        String cacheKey = ProgressConstants.REDIS_KEY_CHECKIN_TIMELINE + projectId;
        redisTemplate.opsForValue().set(cacheKey, timeline, 
                ProgressConstants.REDIS_EXPIRE_SECONDS, TimeUnit.SECONDS);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getTimelineFromCache(Long projectId) {
        String cacheKey = ProgressConstants.REDIS_KEY_CHECKIN_TIMELINE + projectId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        return cached != null ? (List<Map<String, Object>>) cached : null;
    }
}
