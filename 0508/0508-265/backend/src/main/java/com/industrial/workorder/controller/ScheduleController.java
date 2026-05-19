package com.industrial.workorder.controller;

import com.industrial.workorder.entity.Schedule;
import com.industrial.workorder.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @GetMapping
    public List<Schedule> findAll() {
        return scheduleService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Schedule> findById(@PathVariable Long id) {
        Optional<Schedule> schedule = scheduleService.findById(id);
        return schedule.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Schedule> findByUserId(@PathVariable Long userId) {
        return scheduleService.findByUserId(userId);
    }

    @GetMapping("/date/{date}")
    public List<Schedule> findByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return scheduleService.findByDate(date);
    }

    @GetMapping("/range")
    public List<Schedule> findByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return scheduleService.findByDateRange(startDate, endDate);
    }

    @PostMapping
    public Schedule create(@RequestBody Schedule schedule) {
        return scheduleService.save(schedule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Schedule> update(@PathVariable Long id, @RequestBody Schedule schedule) {
        if (!scheduleService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        schedule.setId(id);
        return ResponseEntity.ok(scheduleService.save(schedule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!scheduleService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        scheduleService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
