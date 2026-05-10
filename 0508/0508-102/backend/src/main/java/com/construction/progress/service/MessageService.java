package com.construction.progress.service;

import com.construction.progress.constant.ProgressConstants;
import com.construction.progress.entity.Message;
import com.construction.progress.entity.Project;
import com.construction.progress.entity.ProjectStage;
import com.construction.progress.entity.User;
import com.construction.progress.repository.MessageRepository;
import com.construction.progress.repository.ProjectRepository;
import com.construction.progress.repository.ProjectStageRepository;
import com.construction.progress.repository.UserRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectStageRepository projectStageRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public MessageService(MessageRepository messageRepository,
                         ProjectRepository projectRepository,
                         ProjectStageRepository projectStageRepository,
                         UserRepository userRepository,
                         RedisTemplate<String, Object> redisTemplate) {
        this.messageRepository = messageRepository;
        this.projectRepository = projectRepository;
        this.projectStageRepository = projectStageRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkOverdueStages() {
        System.out.println("开始检查超时工序... " + LocalDateTime.now());
        
        List<Project> activeProjects = projectRepository.findByStatus(Project.Status.ACTIVE);
        
        for (Project project : activeProjects) {
            List<ProjectStage> stages = projectStageRepository.findByProjectIdOrderByStageIndex(project.getId());
            
            for (ProjectStage stage : stages) {
                if (stage.getIsCompleted()) continue;
                if (stage.getPlannedDays() == null || stage.getPlannedDays() <= 0) continue;
                if (stage.getStartTime() == null) continue;
                
                long daysElapsed = ChronoUnit.DAYS.between(
                        stage.getStartTime().toLocalDate(),
                        LocalDate.now()
                );
                
                if (daysElapsed > stage.getPlannedDays() 
                        && stage.getProgress().compareTo(BigDecimal.valueOf(90)) < 0) {
                    
                    if (shouldSendWarning(stage, project.getId())) {
                        sendOverdueWarning(project, stage, (int)(daysElapsed - stage.getPlannedDays()));
                        stage.setLastWarningTime(LocalDateTime.now());
                        projectStageRepository.save(stage);
                    }
                }
            }
        }
        
        updateWarningProjectsCache();
        System.out.println("超时检查完成 " + LocalDateTime.now());
    }

    private boolean shouldSendWarning(ProjectStage stage, Long projectId) {
        if (stage.getLastWarningTime() == null) {
            return true;
        }
        
        long hoursSinceLastWarning = ChronoUnit.HOURS.between(
                stage.getLastWarningTime(),
                LocalDateTime.now()
        );
        
        return hoursSinceLastWarning >= 24;
    }

    @Transactional
    public void sendOverdueWarning(Project project, ProjectStage stage, int overdueDays) {
        String title = String.format("【预警】%s工序已逾期%d天", 
                stage.getStageName(), overdueDays);
        String content = String.format("项目【%s】的【%s】工序已逾期%d天，当前完成进度为%.1f%%，未达到90%%的预警阈值。请加快施工进度！",
                project.getOwnerName(),
                stage.getStageName(),
                overdueDays,
                stage.getProgress());
        
        List<Long> recipientIds = new ArrayList<>();
        recipientIds.add(project.getOwnerId());
        
        List<User> workers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.WORKER)
                .collect(Collectors.toList());
        for (User worker : workers) {
            recipientIds.add(worker.getId());
        }
        
        for (Long userId : recipientIds) {
            Message message = new Message();
            message.setProjectId(project.getId());
            message.setStageIndex(stage.getStageIndex());
            message.setStageName(stage.getStageName());
            message.setUserId(userId);
            message.setTitle(title);
            message.setContent(content);
            message.setType(Message.Type.WARNING);
            message.setIsRead(false);
            message.setRelatedStageProgress(stage.getProgress());
            message.setOverdueDays(overdueDays);
            messageRepository.save(message);
        }
        
        System.out.println("已发送预警消息: " + title);
    }

    public List<Map<String, Object>> getUserMessages(Long userId, Boolean onlyUnread) {
        List<Message> messages;
        if (Boolean.TRUE.equals(onlyUnread)) {
            messages = messageRepository.findByUserIdAndIsReadOrderByCreateTimeDesc(userId, false);
        } else {
            messages = messageRepository.findByUserIdOrderByCreateTimeDesc(userId);
        }
        
        return messages.stream()
                .map(this::convertToMessageDetail)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countByUserIdAndIsRead(userId, false);
    }

    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("消息不存在"));
        message.setIsRead(true);
        messageRepository.save(message);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Message> unreadMessages = messageRepository.findByUserIdAndIsReadOrderByCreateTimeDesc(userId, false);
        for (Message message : unreadMessages) {
            message.setIsRead(true);
            messageRepository.save(message);
        }
    }

    public List<Map<String, Object>> getWarningProjects() {
        String cacheKey = "warning:projects";
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        
        List<Project> activeProjects = projectRepository.findByStatus(Project.Status.ACTIVE);
        List<Map<String, Object>> warningProjects = new ArrayList<>();
        
        for (Project project : activeProjects) {
            List<ProjectStage> stages = projectStageRepository.findByProjectIdOrderByStageIndex(project.getId());
            boolean hasWarning = false;
            List<Map<String, Object>> warningStages = new ArrayList<>();
            
            for (ProjectStage stage : stages) {
                if (stage.getIsCompleted()) continue;
                if (stage.getPlannedDays() == null || stage.getPlannedDays() <= 0) continue;
                if (stage.getStartTime() == null) continue;
                
                long daysElapsed = ChronoUnit.DAYS.between(
                        stage.getStartTime().toLocalDate(),
                        LocalDate.now()
                );
                
                if (daysElapsed > stage.getPlannedDays() 
                        && stage.getProgress().compareTo(BigDecimal.valueOf(90)) < 0) {
                    hasWarning = true;
                    Map<String, Object> warningStage = new LinkedHashMap<>();
                    warningStage.put("stageIndex", stage.getStageIndex());
                    warningStage.put("stageName", stage.getStageName());
                    warningStage.put("progress", stage.getProgress());
                    warningStage.put("plannedDays", stage.getPlannedDays());
                    warningStage.put("daysElapsed", daysElapsed);
                    warningStage.put("overdueDays", (int)(daysElapsed - stage.getPlannedDays()));
                    warningStages.add(warningStage);
                }
            }
            
            if (hasWarning) {
                Map<String, Object> projectInfo = new LinkedHashMap<>();
                projectInfo.put("id", project.getId());
                projectInfo.put("ownerName", project.getOwnerName());
                projectInfo.put("address", project.getAddress());
                projectInfo.put("currentStage", project.getCurrentStage());
                projectInfo.put("currentStageName", ProgressConstants.getStageName(project.getCurrentStage()));
                projectInfo.put("warningStages", warningStages);
                warningProjects.add(projectInfo);
            }
        }
        
        redisTemplate.opsForValue().set(cacheKey, warningProjects, 3600, TimeUnit.SECONDS);
        
        return warningProjects;
    }

    private void updateWarningProjectsCache() {
        String cacheKey = "warning:projects";
        redisTemplate.delete(cacheKey);
        getWarningProjects();
    }

    private Map<String, Object> convertToMessageDetail(Message message) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("id", message.getId());
        detail.put("projectId", message.getProjectId());
        detail.put("stageIndex", message.getStageIndex());
        detail.put("stageName", message.getStageName());
        detail.put("userId", message.getUserId());
        detail.put("title", message.getTitle());
        detail.put("content", message.getContent());
        detail.put("type", message.getType().name());
        detail.put("isRead", message.getIsRead());
        detail.put("relatedStageProgress", message.getRelatedStageProgress());
        detail.put("overdueDays", message.getOverdueDays());
        detail.put("createTime", message.getCreateTime());
        return detail;
    }
}
