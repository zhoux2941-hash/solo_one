package com.iot.light.controller;

import com.iot.light.service.LightControlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/light")
public class LightController {

    private final LightControlService lightControlService;

    @Autowired
    public LightController(LightControlService lightControlService) {
        this.lightControlService = lightControlService;
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", lightControlService.getCurrentLightStatus());
        response.put("timestamp", System.currentTimeMillis());
        log.info("查询灯状态: {}", lightControlService.getCurrentLightStatus());
        return response;
    }

    @PostMapping("/on")
    public Map<String, Object> turnOn() {
        log.info("API 调用: 开灯");
        lightControlService.controlLight("ON");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "灯已开启");
        response.put("status", lightControlService.getCurrentLightStatus());
        return response;
    }

    @PostMapping("/off")
    public Map<String, Object> turnOff() {
        log.info("API 调用: 关灯");
        lightControlService.controlLight("OFF");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "灯已关闭");
        response.put("status", lightControlService.getCurrentLightStatus());
        return response;
    }

    @PostMapping("/toggle")
    public Map<String, Object> toggle() {
        String currentStatus = lightControlService.getCurrentLightStatus();
        String newCommand = "ON".equals(currentStatus) ? "OFF" : "ON";
        
        log.info("API 调用: 切换状态 ({} -> {})", currentStatus, newCommand);
        lightControlService.controlLight(newCommand);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "状态已切换");
        response.put("status", lightControlService.getCurrentLightStatus());
        return response;
    }
}
