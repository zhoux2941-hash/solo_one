package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.service.QRCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/qrcode")
@CrossOrigin
public class QRCodeController {

    @Autowired
    private QRCodeService qrCodeService;

    @GetMapping("/activity/{activityId}")
    public CommonResult<Map<String, Object>> generateActivityQRCode(
            @PathVariable Long activityId,
            @RequestParam(required = false) String baseUrl) {
        try {
            Map<String, Object> result = qrCodeService.generateActivityQRCode(activityId, baseUrl);
            return CommonResult.success("二维码生成成功", result);
        } catch (Exception e) {
            return CommonResult.error("二维码生成失败: " + e.getMessage());
        }
    }

    @PostMapping("/parse")
    public CommonResult<Map<String, String>> parseQRCodeContent(@RequestBody Map<String, String> params) {
        try {
            String content = params.get("content");
            if (content == null || content.isEmpty()) {
                return CommonResult.error("二维码内容为空");
            }
            
            Map<String, String> result = new java.util.HashMap<>();
            
            if (content.contains("activityId=")) {
                int idx = content.indexOf("activityId=");
                int endIdx = content.indexOf("&", idx);
                if (endIdx == -1) endIdx = content.length();
                String activityIdStr = content.substring(idx + 11, endIdx);
                result.put("activityId", activityIdStr);
                
                int nameIdx = content.indexOf("activityName=");
                if (nameIdx != -1) {
                    String nameValue = content.substring(nameIdx + 13);
                    result.put("activityName", java.net.URLDecoder.decode(nameValue, "UTF-8"));
                }
                
                result.put("type", "activity");
                return CommonResult.success("解析成功", result);
            } else {
                return CommonResult.error("无效的活动二维码");
            }
        } catch (Exception e) {
            return CommonResult.error("解析失败: " + e.getMessage());
        }
    }
}
