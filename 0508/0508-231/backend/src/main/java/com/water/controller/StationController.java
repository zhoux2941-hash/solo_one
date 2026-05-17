package com.water.controller;

import com.water.entity.Station;
import com.water.service.StationService;
import com.water.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/stations")
public class StationController {
    @Autowired
    private StationService stationService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public Map<String, Object> getStations(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String region) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            Page<Station> stationPage = stationService.findAll(page, size, region);
            result.put("success", true);
            result.put("data", stationPage.getContent());
            result.put("total", stationPage.getTotalElements());
            result.put("totalPages", stationPage.getTotalPages());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取站点列表失败");
        }
        
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getStationById(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            Station station = stationService.findById(id).orElse(null);
            if (station == null) {
                result.put("success", false);
                result.put("message", "站点不存在");
                return result;
            }
            
            result.put("success", true);
            result.put("data", station);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取站点信息失败");
        }
        
        return result;
    }

    @PostMapping
    public Map<String, Object> createStation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Station station) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role) && !"INSPECTOR".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            station.setId(null);
            return stationService.save(station);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "创建站点失败");
        }
        
        return result;
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateStation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Station station) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role) && !"INSPECTOR".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            station.setId(id);
            return stationService.save(station);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "更新站点失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/toggle")
    public Map<String, Object> toggleStation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            String role = jwtUtil.getRoleFromToken(token);
            if (!"ADMIN".equals(role)) {
                result.put("success", false);
                result.put("message", "无权限访问");
                return result;
            }
            
            return stationService.toggleActive(id);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "操作失败");
        }
        
        return result;
    }
}
