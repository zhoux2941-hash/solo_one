package com.buscompany.fatigue.controller;

import com.buscompany.fatigue.dto.DeviceDataRequest;
import com.buscompany.fatigue.entity.DeviceData;
import com.buscompany.fatigue.service.FatigueMonitorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/device")
@CrossOrigin(origins = "*")
public class DeviceController {
    @Autowired
    private FatigueMonitorService monitorService;

    @PostMapping("/report")
    public ResponseEntity<Map<String, Object>> reportData(@RequestBody DeviceDataRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (request.getDriverNo() == null || request.getDriverNo().isEmpty()) {
            response.put("success", false);
            response.put("message", "司机编号不能为空");
            return ResponseEntity.badRequest().body(response);
        }

        DeviceData data = monitorService.processDeviceData(request);
        response.put("success", true);
        response.put("message", "数据上报成功");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }
}
