package com.festival.volunteer.service;

import com.festival.volunteer.dto.ScheduleRequest;
import com.festival.volunteer.entity.*;
import com.festival.volunteer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final VolunteerApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final PositionService positionService;

    @Transactional
    public Schedule createSchedule(ScheduleRequest request) {
        User volunteer = userRepository.findById(request.getVolunteerId())
                .orElseThrow(() -> new RuntimeException("志愿者不存在"));

        if (volunteer.getRole() != User.Role.VOLUNTEER) {
            throw new RuntimeException("只能为志愿者分配排班");
        }

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new RuntimeException("岗位不存在"));

        VolunteerApplication application = null;
        if (request.getApplicationId() != null) {
            application = applicationRepository.findById(request.getApplicationId())
                    .orElseThrow(() -> new RuntimeException("申请不存在"));
            application.setStatus(VolunteerApplication.ApplicationStatus.ASSIGNED);
            applicationRepository.save(application);
        }

        Schedule schedule = new Schedule();
        schedule.setVolunteer(volunteer);
        schedule.setPosition(position);
        schedule.setApplication(application);
        schedule.setScheduleDate(request.getScheduleDate());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setLocation(request.getLocation());
        schedule.setNotes(request.getNotes());
        schedule.setStatus(Schedule.ScheduleStatus.PENDING);

        schedule = scheduleRepository.save(schedule);

        positionService.incrementCurrentCount(position.getId());

        notificationService.createNotification(
            volunteer.getId(),
            "排班分配通知",
            "您已被分配排班：" + position.getName() + "，时间：" + request.getScheduleDate() + 
            " " + request.getStartTime() + "-" + request.getEndTime() + "，地点：" + request.getLocation(),
            Notification.NotificationType.SCHEDULE_ASSIGNED,
            schedule.getId()
        );

        return schedule;
    }

    public List<Schedule> getMySchedules(Long volunteerId) {
        return scheduleRepository.findByVolunteerId(volunteerId);
    }

    public List<Schedule> getSchedulesByPosition(Long positionId) {
        return scheduleRepository.findByPositionId(positionId);
    }

    public List<Schedule> getSchedulesByDate(String date) {
        return scheduleRepository.findByScheduleDate(date);
    }

    public Schedule getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("排班不存在"));
    }

    @Transactional
    public Schedule updateScheduleStatus(Long id, Schedule.ScheduleStatus status) {
        Schedule schedule = getScheduleById(id);
        schedule.setStatus(status);
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public void cancelSchedule(Long id) {
        Schedule schedule = getScheduleById(id);
        schedule.setStatus(Schedule.ScheduleStatus.CANCELLED);
        scheduleRepository.save(schedule);

        positionService.decrementCurrentCount(schedule.getPosition().getId());
    }

    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public List<Schedule> getSchedulesByDateAndStatus(String date, Schedule.ScheduleStatus status) {
        return scheduleRepository.findByDateAndStatus(date, status);
    }
}
