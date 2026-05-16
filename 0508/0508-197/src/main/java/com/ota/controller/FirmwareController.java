package com.ota.controller;

import com.ota.entity.Firmware;
import com.ota.service.FirmwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/firmware")
@CrossOrigin(origins = "*")
public class FirmwareController {
    
    private static final Pattern VERSION_PATTERN = Pattern.compile("^\\d+\\.\\d+\\.\\d+$");
    
    @Autowired
    private FirmwareService firmwareService;
    
    private boolean isValidVersion(String version) {
        return version != null && VERSION_PATTERN.matcher(version).matches();
    }
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFirmware(
            @RequestParam("file") MultipartFile file,
            @RequestParam("version") String version,
            @RequestParam("deviceModel") String deviceModel,
            @RequestParam(value = "description", required = false) String description) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (!StringUtils.hasText(version)) {
                response.put("success", false);
                response.put("message", "版本号不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!isValidVersion(version)) {
                response.put("success", false);
                response.put("message", "版本号格式不正确，请使用 主版本.次版本.修订号 格式（如: 1.0.0）");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!StringUtils.hasText(deviceModel)) {
                response.put("success", false);
                response.put("message", "设备型号不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (file == null || file.isEmpty()) {
                response.put("success", false);
                response.put("message", "请选择固件文件");
                return ResponseEntity.badRequest().body(response);
            }
            
            Firmware firmware = firmwareService.uploadFirmware(file, version, deviceModel, description);
            response.put("success", true);
            response.put("data", firmware);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "上传失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/upload-mock")
    public ResponseEntity<Map<String, Object>> uploadFirmwareMock(
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String version = (String) request.get("version");
            String deviceModel = (String) request.get("deviceModel");
            String description = (String) request.getOrDefault("description", "");
            String fileName = (String) request.getOrDefault("fileName", "firmware_" + version + ".bin");
            Integer fileSizeInt = (Integer) request.getOrDefault("fileSize", 1024);
            
            if (!StringUtils.hasText(version)) {
                response.put("success", false);
                response.put("message", "版本号不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!isValidVersion(version)) {
                response.put("success", false);
                response.put("message", "版本号格式不正确，请使用 主版本.次版本.修订号 格式（如: 1.0.0）");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!StringUtils.hasText(deviceModel)) {
                response.put("success", false);
                response.put("message", "设备型号不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            long fileSize = fileSizeInt != null ? fileSizeInt.longValue() : 1048576L;
            
            Firmware firmware = firmwareService.uploadFirmwareMock(version, deviceModel, description, fileName, fileSize);
            response.put("success", true);
            response.put("data", firmware);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "上传失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/list")
    public ResponseEntity<List<Firmware>> getAllFirmware() {
        return ResponseEntity.ok(firmwareService.getAllFirmware());
    }
    
    @GetMapping("/model/{deviceModel}")
    public ResponseEntity<List<Firmware>> getFirmwareByModel(@PathVariable String deviceModel) {
        return ResponseEntity.ok(firmwareService.getFirmwareByModel(deviceModel));
    }
    
    @GetMapping("/latest/{deviceModel}")
    public ResponseEntity<Firmware> getLatestFirmware(@PathVariable String deviceModel) {
        return firmwareService.getLatestFirmware(deviceModel)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFirmware(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            firmwareService.deleteFirmware(id);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Delete failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/download/{version}")
    public ResponseEntity<Map<String, Object>> downloadFirmware(@PathVariable String version) {
        Map<String, Object> response = new HashMap<>();
        response.put("version", version);
        response.put("message", "Firmware download simulation - firmware_" + version + ".bin");
        response.put("downloadStatus", "success");
        return ResponseEntity.ok(response);
    }
}
