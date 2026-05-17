package com.museum.humidity.controller;

import com.museum.humidity.entity.ControlLog;
import com.museum.humidity.service.ControlLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/control-logs")
public class ControlLogController {
    @Autowired
    private ControlLogService logService;

    @GetMapping("/device/{deviceId}")
    public List<ControlLog> getLogsByDeviceId(
            @PathVariable Long deviceId,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        return logService.getRecentLogs(deviceId, limit);
    }
}
