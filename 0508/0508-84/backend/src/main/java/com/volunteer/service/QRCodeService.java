package com.volunteer.service;

import com.volunteer.entity.Activity;
import com.volunteer.repository.ActivityRepository;
import com.volunteer.util.QRCodeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class QRCodeService {

    @Autowired
    private ActivityRepository activityRepository;

    @Value("${server.port:8080}")
    private String serverPort;

    public Map<String, Object> generateActivityQRCode(Long activityId, String customBaseUrl) throws Exception {
        Optional<Activity> activityOpt = activityRepository.findById(activityId);
        if (!activityOpt.isPresent()) {
            throw new RuntimeException("活动不存在");
        }
        
        Activity activity = activityOpt.get();
        
        String baseUrl = customBaseUrl != null && !customBaseUrl.isEmpty() 
            ? customBaseUrl 
            : "volunteer://activity";
        
        String qrContent = baseUrl + "?activityId=" + activityId + "&activityName=" + java.net.URLEncoder.encode(activity.getName(), "UTF-8");
        String qrCodeBase64 = QRCodeUtil.generateActivityQRCode(activityId, activity.getName(), baseUrl);
        
        Map<String, Object> result = new HashMap<>();
        result.put("activityId", activityId);
        result.put("activityName", activity.getName());
        result.put("qrContent", qrContent);
        result.put("qrCodeBase64", qrCodeBase64);
        return result;
    }
}
