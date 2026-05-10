package com.pest.service;

import com.pest.entity.Report;
import com.pest.entity.User;
import com.pest.websocket.NotificationWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationWebSocketHandler webSocketHandler;

    @Autowired
    private UserService userService;

    public void notifyDiagnosisComplete(Report report, User expert) {
        try {
            User farmer = userService.getById(report.getFarmerId());
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "DIAGNOSIS_COMPLETE");
            notification.put("reportId", report.getId());
            notification.put("cropType", report.getCropType());
            notification.put("pestName", report.getPestName());
            notification.put("severity", report.getSeverity());
            notification.put("expertName", expert.getName());
            notification.put("createTime", LocalDateTime.now());
            notification.put("message", String.format(
                    "您的【%s】病虫害报告已被【%s】专家诊断，病虫害类型：%s，严重程度：%s",
                    report.getCropType(),
                    expert.getName(),
                    report.getPestName(),
                    severityText(report.getSeverity())
            ));

            webSocketHandler.sendNotification(report.getFarmerId(), notification);
        } catch (Exception e) {
            // 忽略通知发送失败，不影响主业务流程
        }
    }

    private String severityText(Report.Severity severity) {
        if (severity == null) return "未知";
        switch (severity) {
            case LIGHT: return "轻度";
            case MEDIUM: return "中度";
            case SEVERE: return "重度";
            default: return severity.name();
        }
    }
}