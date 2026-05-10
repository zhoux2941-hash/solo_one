package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.entity.User;
import com.volunteer.service.AttendanceService;
import com.volunteer.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
@CrossOrigin
public class RankingController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private UserService userService;

    @GetMapping
    public CommonResult<List<Map<String, Object>>> getRanking() {
        List<Object[]> rankingList = attendanceService.getRanking();
        List<Map<String, Object>> result = new ArrayList<>();
        
        int rank = 1;
        for (Object[] item : rankingList) {
            Long userId = (Long) item[0];
            Long totalMinutes = (Long) item[1];
            
            User user = userService.findById(userId).orElse(null);
            if (user != null) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("rank", rank++);
                entry.put("userId", userId);
                entry.put("realName", user.getRealName());
                entry.put("username", user.getUsername());
                entry.put("totalMinutes", totalMinutes);
                entry.put("totalHours", Math.round(totalMinutes / 60.0 * 10) / 10.0);
                entry.put("timeCoins", (totalMinutes / 60) * 10);
                result.add(entry);
            }
        }
        
        return CommonResult.success(result);
    }
}
