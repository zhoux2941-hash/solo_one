package com.water.controller;

import com.water.entity.WaterDistrict;
import com.water.service.WaterDistrictService;
import com.water.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/water-districts")
public class WaterDistrictController {
    @Autowired
    private WaterDistrictService waterDistrictService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public Map<String, Object> getWaterDistricts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long stationId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }
            
            Page<WaterDistrict> waterDistrictPage = waterDistrictService.findAll(page, size, stationId);
            result.put("success", true);
            result.put("data", waterDistrictPage.getContent());
            result.put("total", waterDistrictPage.getTotalElements());
            result.put("totalPages", waterDistrictPage.getTotalPages());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取片区列表失败");
        }
        
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getWaterDistrictById(
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
            
            WaterDistrict waterDistrict = waterDistrictService.findById(id).orElse(null);
            if (waterDistrict == null) {
                result.put("success", false);
                result.put("message", "片区不存在");
                return result;
            }
            
            result.put("success", true);
            result.put("data", waterDistrict);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取片区信息失败");
        }
        
        return result;
    }

    @PostMapping
    public Map<String, Object> createWaterDistrict(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestData) {
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
            
            WaterDistrict waterDistrict = new WaterDistrict();
            waterDistrict.setId(null);
            waterDistrict.setName((String) requestData.get("name"));
            waterDistrict.setStreet((String) requestData.get("street"));
            waterDistrict.setCommunity((String) requestData.get("community"));
            waterDistrict.setResidentialArea((String) requestData.get("residentialArea"));
            waterDistrict.setTotalHouseholds(parseInteger(requestData.get("totalHouseholds")));
            waterDistrict.setResidentPopulation(parseInteger(requestData.get("residentPopulation")));
            waterDistrict.setRemark((String) requestData.get("remark"));
            waterDistrict.setActive(true);
            
            Long stationId = parseLong(requestData.get("stationId"));
            Long mainPipeId = parseLong(requestData.get("mainPipeId"));
            
            return waterDistrictService.save(waterDistrict, stationId, mainPipeId);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "创建片区失败");
        }
        
        return result;
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateWaterDistrict(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestData) {
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
            
            WaterDistrict waterDistrict = waterDistrictService.findById(id).orElse(null);
            if (waterDistrict == null) {
                result.put("success", false);
                result.put("message", "片区不存在");
                return result;
            }
            
            waterDistrict.setName((String) requestData.get("name"));
            waterDistrict.setStreet((String) requestData.get("street"));
            waterDistrict.setCommunity((String) requestData.get("community"));
            waterDistrict.setResidentialArea((String) requestData.get("residentialArea"));
            waterDistrict.setTotalHouseholds(parseInteger(requestData.get("totalHouseholds")));
            waterDistrict.setResidentPopulation(parseInteger(requestData.get("residentPopulation")));
            waterDistrict.setRemark((String) requestData.get("remark"));
            
            Long stationId = parseLong(requestData.get("stationId"));
            Long mainPipeId = parseLong(requestData.get("mainPipeId"));
            
            return waterDistrictService.save(waterDistrict, stationId, mainPipeId);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "更新片区失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/toggle")
    public Map<String, Object> toggleWaterDistrict(
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
            
            return waterDistrictService.toggleActive(id);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "操作失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/change-station")
    public Map<String, Object> changeStation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestData) {
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
            
            Long newStationId = parseLong(requestData.get("stationId"));
            return waterDistrictService.changeStation(id, newStationId);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "变更归属站点失败");
        }
        
        return result;
    }

    private Long parseLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
