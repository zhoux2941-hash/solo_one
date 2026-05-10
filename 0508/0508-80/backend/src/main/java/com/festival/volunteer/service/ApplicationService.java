package com.festival.volunteer.service;

import com.festival.volunteer.dto.ApplicationRequest;
import com.festival.volunteer.entity.Position;
import com.festival.volunteer.entity.User;
import com.festival.volunteer.entity.VolunteerApplication;
import com.festival.volunteer.repository.PositionRepository;
import com.festival.volunteer.repository.UserRepository;
import com.festival.volunteer.repository.VolunteerApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final VolunteerApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final NotificationService notificationService;

    @Transactional
    public VolunteerApplication apply(Long userId, ApplicationRequest request) {
        if (applicationRepository.existsByUserIdAndPositionId(userId, request.getPositionId())) {
            throw new RuntimeException("您已申请过该岗位");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new RuntimeException("岗位不存在"));

        if (position.getStatus() == Position.PositionStatus.INACTIVE) {
            throw new RuntimeException("该岗位已停止招募");
        }

        if (position.getStatus() == Position.PositionStatus.FULL) {
            throw new RuntimeException("该岗位已满员");
        }

        VolunteerApplication application = new VolunteerApplication();
        application.setUser(user);
        application.setPosition(position);
        application.setPreferredTime(request.getPreferredTime());
        application.setNotes(request.getNotes());
        application.setStatus(VolunteerApplication.ApplicationStatus.PENDING);

        return applicationRepository.save(application);
    }

    public List<VolunteerApplication> getMyApplications(Long userId) {
        return applicationRepository.findByUserId(userId);
    }

    public List<VolunteerApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    public List<VolunteerApplication> getApplicationsByStatus(VolunteerApplication.ApplicationStatus status) {
        return applicationRepository.findByStatus(status);
    }

    public List<VolunteerApplication> getApplicationsByPosition(Long positionId) {
        return applicationRepository.findByPositionId(positionId);
    }

    public List<VolunteerApplication> getPendingApplicationsByPosition(Long positionId) {
        return applicationRepository.findByPositionIdAndStatusIn(
            positionId,
            List.of(VolunteerApplication.ApplicationStatus.PENDING, VolunteerApplication.ApplicationStatus.APPROVED)
        );
    }

    @Transactional
    public VolunteerApplication approve(Long applicationId) {
        VolunteerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("申请不存在"));

        application.setStatus(VolunteerApplication.ApplicationStatus.APPROVED);
        application = applicationRepository.save(application);

        notificationService.createNotification(
            application.getUser().getId(),
            "申请已通过",
            "您申请的岗位 [" + application.getPosition().getName() + "] 已通过审核，请等待排班分配。",
            com.festival.volunteer.entity.Notification.NotificationType.APPROVAL,
            null
        );

        return application;
    }

    @Transactional
    public VolunteerApplication reject(Long applicationId, String reason) {
        VolunteerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("申请不存在"));

        application.setStatus(VolunteerApplication.ApplicationStatus.REJECTED);
        application.setNotes(reason);
        application = applicationRepository.save(application);

        notificationService.createNotification(
            application.getUser().getId(),
            "申请被拒绝",
            "您申请的岗位 [" + application.getPosition().getName() + "] 被拒绝，原因：" + reason,
            com.festival.volunteer.entity.Notification.NotificationType.REJECTION,
            null
        );

        return application;
    }

    public VolunteerApplication getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
    }
}
