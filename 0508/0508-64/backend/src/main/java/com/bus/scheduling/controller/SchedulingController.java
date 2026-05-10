package com.bus.scheduling.controller;

import com.bus.scheduling.dto.ScheduleDTO;
import com.bus.scheduling.dto.SchedulingRequestDTO;
import com.bus.scheduling.dto.SchedulingResultDTO;
import com.bus.scheduling.service.SchedulingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/scheduling")
@RequiredArgsConstructor
public class SchedulingController {

    private final SchedulingService schedulingService;

    @PostMapping("/generate")
    public ResponseEntity<SchedulingResultDTO> generateSchedule(@Valid @RequestBody SchedulingRequestDTO request) {
        SchedulingResultDTO result = schedulingService.generateSchedule(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/today")
    public ResponseEntity<List<ScheduleDTO>> getTodaySchedules() {
        return ResponseEntity.ok(schedulingService.getTodaySchedules());
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> resetTodaySchedule() {
        schedulingService.resetTodaySchedule();
        return ResponseEntity.ok().build();
    }
}
