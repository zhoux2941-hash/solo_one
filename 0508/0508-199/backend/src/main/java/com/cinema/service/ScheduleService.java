package com.cinema.service;

import com.cinema.entity.Schedule;
import com.cinema.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ScheduleService {
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    public List<Schedule> getSchedulesByMovie(Long movieId) {
        return scheduleRepository.findByMovieId(movieId);
    }
    
    public Schedule getScheduleById(Long id) {
        return scheduleRepository.findById(id).orElse(null);
    }
    
    public Schedule saveSchedule(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }
}