package com.festival.volunteer.service;

import com.festival.volunteer.dto.ShiftSwapRequestDTO;
import com.festival.volunteer.entity.Notification;
import com.festival.volunteer.entity.Schedule;
import com.festival.volunteer.entity.ShiftSwapRequest;
import com.festival.volunteer.entity.User;
import com.festival.volunteer.repository.ScheduleRepository;
import com.festival.volunteer.repository.ShiftSwapRequestRepository;
import com.festival.volunteer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShiftSwapService {

    private final ShiftSwapRequestRepository shiftSwapRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ShiftSwapRequest createSwapRequest(Long fromVolunteerId, ShiftSwapRequestDTO dto) {
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new RuntimeException("排班不存在"));

        if (!schedule.getVolunteer().getId().equals(fromVolunteerId)) {
            throw new RuntimeException("只能申请换自己的班次");
        }

        if (schedule.getStatus() == Schedule.ScheduleStatus.CHECKED_IN || 
            schedule.getStatus() == Schedule.ScheduleStatus.COMPLETED) {
            throw new RuntimeException("已签到或已完成的班次无法换班");
        }

        if (shiftSwapRepository.existsByScheduleIdAndStatusIn(
                schedule.getId(), 
                Arrays.asList(ShiftSwapRequest.SwapStatus.PENDING))) {
            throw new RuntimeException("该班次已有换班申请待审批");
        }

        if (dto.getToVolunteerId().equals(fromVolunteerId)) {
            throw new RuntimeException("不能申请换给自己");
        }

        User toVolunteer = userRepository.findById(dto.getToVolunteerId())
                .orElseThrow(() -> new RuntimeException("目标志愿者不存在"));

        if (toVolunteer.getRole() != User.Role.VOLUNTEER) {
            throw new RuntimeException("目标用户不是志愿者");
        }

        ShiftSwapRequest request = new ShiftSwapRequest();
        request.setFromVolunteer(schedule.getVolunteer());
        request.setToVolunteer(toVolunteer);
        request.setSchedule(schedule);
        request.setReason(dto.getReason());
        request.setStatus(ShiftSwapRequest.SwapStatus.PENDING);

        request = shiftSwapRepository.save(request);

        String title = "换班申请通知";
        String content = String.format("志愿者【%s】申请与您换班：%s %s-%s @ %s，原因：%s",
                schedule.getVolunteer().getName(),
                schedule.getScheduleDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getLocation(),
                dto.getReason() != null ? dto.getReason() : "无");
        notificationService.createNotification(
                dto.getToVolunteerId(),
                title,
                content,
                Notification.NotificationType.SYSTEM,
                schedule.getId()
        );

        return request;
    }

    @Transactional
    public ShiftSwapRequest acceptSwapRequest(Long requestId, Long toVolunteerId, String replyNote) {
        ShiftSwapRequest request = shiftSwapRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("换班申请不存在"));

        if (!request.getToVolunteer().getId().equals(toVolunteerId)) {
            throw new RuntimeException("无权处理此换班申请");
        }

        if (request.getStatus() != ShiftSwapRequest.SwapStatus.PENDING) {
            throw new RuntimeException("该换班申请已处理");
        }

        Schedule schedule = request.getSchedule();
        User originalVolunteer = request.getFromVolunteer();
        User newVolunteer = request.getToVolunteer();

        schedule.setVolunteer(newVolunteer);
        scheduleRepository.save(schedule);

        request.setStatus(ShiftSwapRequest.SwapStatus.ACCEPTED);
        request.setReplyNote(replyNote);
        request = shiftSwapRepository.save(request);

        String title = "换班申请已通过";
        String content = String.format("您的换班申请已被【%s】接受，班次：%s %s-%s @ %s 已交接给对方",
                newVolunteer.getName(),
                schedule.getScheduleDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getLocation());
        notificationService.createNotification(
                originalVolunteer.getId(),
                title,
                content,
                Notification.NotificationType.SYSTEM,
                schedule.getId()
        );

        return request;
    }

    @Transactional
    public ShiftSwapRequest rejectSwapRequest(Long requestId, Long toVolunteerId, String replyNote) {
        ShiftSwapRequest request = shiftSwapRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("换班申请不存在"));

        if (!request.getToVolunteer().getId().equals(toVolunteerId)) {
            throw new RuntimeException("无权处理此换班申请");
        }

        if (request.getStatus() != ShiftSwapRequest.SwapStatus.PENDING) {
            throw new RuntimeException("该换班申请已处理");
        }

        request.setStatus(ShiftSwapRequest.SwapStatus.REJECTED);
        request.setReplyNote(replyNote);
        request = shiftSwapRepository.save(request);

        String title = "换班申请已被拒绝";
        String content = String.format("您的换班申请已被【%s】拒绝，原因：%s",
                request.getToVolunteer().getName(),
                replyNote != null ? replyNote : "无");
        notificationService.createNotification(
                request.getFromVolunteer().getId(),
                title,
                content,
                Notification.NotificationType.SYSTEM,
                request.getSchedule().getId()
        );

        return request;
    }

    @Transactional
    public ShiftSwapRequest cancelSwapRequest(Long requestId, Long fromVolunteerId) {
        ShiftSwapRequest request = shiftSwapRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("换班申请不存在"));

        if (!request.getFromVolunteer().getId().equals(fromVolunteerId)) {
            throw new RuntimeException("无权取消此换班申请");
        }

        if (request.getStatus() != ShiftSwapRequest.SwapStatus.PENDING) {
            throw new RuntimeException("该换班申请已处理，无法取消");
        }

        request.setStatus(ShiftSwapRequest.SwapStatus.CANCELLED);
        return shiftSwapRepository.save(request);
    }

    public List<ShiftSwapRequest> getMySentRequests(Long volunteerId) {
        return shiftSwapRepository.findByFromVolunteerIdOrderByCreatedAtDesc(volunteerId);
    }

    public List<ShiftSwapRequest> getMyReceivedRequests(Long volunteerId) {
        return shiftSwapRepository.findByToVolunteerIdOrderByCreatedAtDesc(volunteerId);
    }

    public ShiftSwapRequest getRequestById(Long id) {
        return shiftSwapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("换班申请不存在"));
    }
}
