package com.ota.controller;

import com.ota.entity.DeviceUpgrade;
import com.ota.service.DeviceUpgradeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/device")
@CrossOrigin(origins = "*")
public class DeviceController {
    
    private static final Pattern VERSION_PATTERN = Pattern.compile("^\\d+\\.\\d+\\.\\d+$");
    
    @Autowired
    private DeviceUpgradeService deviceUpgradeService;
    
    private boolean isValidVersion(String version) {
        return version != null && VERSION_PATTERN.matcher(version).matches();
    }
    
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> checkForUpgrade(@RequestBody Map<String, String> request) {
        String deviceId = request.get("deviceId");
        String deviceModel = request.get("deviceModel");
        String currentVersion = request.get("currentVersion");
        
        Map<String, Object> response = new HashMap<>();
        
        if (!StringUtils.hasText(deviceId)) {
            response.put("success", false);
            response.put("message", "设备ID不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        if (!StringUtils.hasText(deviceModel)) {
            response.put("success", false);
            response.put("message", "设备型号不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        if (!StringUtils.hasText(currentVersion)) {
            response.put("success", false);
            response.put("message", "当前版本不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        if (!isValidVersion(currentVersion)) {
            response.put("success", false);
            response.put("message", "版本号格式不正确，请使用 主版本.次版本.修订号 格式（如: 1.0.0）");
            return ResponseEntity.badRequest().body(response);
        }
        
        Map<String, Object> result = deviceUpgradeService.checkForUpgrade(deviceId, deviceModel, currentVersion);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/report")
    public ResponseEntity<Map<String, Object>> reportUpgradeResult(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Object upgradeIdObj = request.get("upgradeId");
            Object successObj = request.get("success");
            
            if (upgradeIdObj == null) {
                response.put("success", false);
                response.put("message", "升级记录ID不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (successObj == null) {
                response.put("success", false);
                response.put("message", "升级结果不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            Long upgradeId = Long.valueOf(upgradeIdObj.toString());
            boolean success = (Boolean) successObj;
            String failureReason = (String) request.get("failureReason");
            
            DeviceUpgrade upgrade = deviceUpgradeService.reportUpgradeResult(upgradeId, success, failureReason);
            
            if (upgrade != null) {
                response.put("success", true);
                response.put("data", upgrade);
            } else {
                response.put("success", false);
                response.put("message", "升级记录不存在");
            }
        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "升级记录ID格式不正确");
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "参数错误: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/upgrades")
    public ResponseEntity<List<DeviceUpgrade>> getAllUpgrades() {
        return ResponseEntity.ok(deviceUpgradeService.getAllUpgrades());
    }
    
    @GetMapping("/upgrades/{deviceId}")
    public ResponseEntity<List<DeviceUpgrade>> getUpgradesByDevice(@PathVariable String deviceId) {
        return ResponseEntity.ok(deviceUpgradeService.getUpgradesByDevice(deviceId));
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(deviceUpgradeService.getStatistics());
    }
}
