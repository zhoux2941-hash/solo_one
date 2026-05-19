package com.industrial.workorder.service;

import com.industrial.workorder.entity.Schedule;
import com.industrial.workorder.repository.ScheduleRepository;
import com.industrial.workorder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Schedule> findAll() {
        List<Schedule> schedules = scheduleRepository.findAll();
        schedules.forEach(this::populateTransientFields);
        return schedules;
    }

    public Optional<Schedule> findById(Long id) {
        Optional<Schedule> scheduleOpt = scheduleRepository.findById(id);
        scheduleOpt.ifPresent(this::populateTransientFields);
        return scheduleOpt;
    }

    public List<Schedule> findByUserId(Long userId) {
        List<Schedule> schedules = scheduleRepository.findByUserId(userId);
        schedules.forEach(this::populateTransientFields);
        return schedules;
    }

    public List<Schedule> findByDate(LocalDate date) {
        List<Schedule> schedules = scheduleRepository.findByScheduleDate(date);
        schedules.forEach(this::populateTransientFields);
        return schedules;
    }

    public List<Schedule> findByDateRange(LocalDate startDate, LocalDate endDate) {
        List<Schedule> schedules = scheduleRepository.findByScheduleDateBetween(startDate, endDate);
        schedules.forEach(this::populateTransientFields);
        return schedules;
    }

    public Schedule save(Schedule schedule) {
        Schedule saved = scheduleRepository.save(schedule);
        populateTransientFields(saved);
        return saved;
    }

    public void deleteById(Long id) {
        scheduleRepository.deleteById(id);
    }

    private void populateTransientFields(Schedule schedule) {
        userRepository.findById(schedule.getUserId()).ifPresent(u -> schedule.setUserName(u.getRealName()));
    }
}
