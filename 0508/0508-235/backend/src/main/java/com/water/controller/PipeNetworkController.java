package com.water.controller;

import com.water.entity.PipeNetwork;
import com.water.service.PipeNetworkService;
import com.water.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/pipe-networks")
public class PipeNetworkController {
    @Autowired
    private PipeNetworkService pipeNetworkService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public Map<String, Object> getPipeNetworks(
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
            
            Page<PipeNetwork> pipeNetworkPage = pipeNetworkService.findAll(page, size, stationId);
            result.put("success", true);
            result.put("data", pipeNetworkPage.getContent());
            result.put("total", pipeNetworkPage.getTotalElements());
            result.put("totalPages", pipeNetworkPage.getTotalPages());
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取管网列表失败");
        }
        
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getPipeNetworkById(
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
            
            PipeNetwork pipeNetwork = pipeNetworkService.findById(id).orElse(null);
            if (pipeNetwork == null) {
                result.put("success", false);
                result.put("message", "管网不存在");
                return result;
            }
            
            result.put("success", true);
            result.put("data", pipeNetwork);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "获取管网信息失败");
        }
        
        return result;
    }

    @PostMapping
    public Map<String, Object> createPipeNetwork(
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
            
            PipeNetwork pipeNetwork = new PipeNetwork();
            pipeNetwork.setId(null);
            pipeNetwork.setRoadSection((String) requestData.get("roadSection"));
            pipeNetwork.setPipeDiameter((String) requestData.get("pipeDiameter"));
            pipeNetwork.setLayYear(parseInteger(requestData.get("layYear")));
            pipeNetwork.setBuryDepth(parseDouble(requestData.get("buryDepth")));
            pipeNetwork.setPipeMaterial((String) requestData.get("pipeMaterial"));
            pipeNetwork.setRemark((String) requestData.get("remark"));
            pipeNetwork.setActive(true);
            
            Long stationId = parseLong(requestData.get("stationId"));
            
            return pipeNetworkService.save(pipeNetwork, stationId);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "创建管网失败");
        }
        
        return result;
    }

    @PutMapping("/{id}")
    public Map<String, Object> updatePipeNetwork(
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
            
            PipeNetwork pipeNetwork = pipeNetworkService.findById(id).orElse(null);
            if (pipeNetwork == null) {
                result.put("success", false);
                result.put("message", "管网不存在");
                return result;
            }
            
            pipeNetwork.setRoadSection((String) requestData.get("roadSection"));
            pipeNetwork.setPipeDiameter((String) requestData.get("pipeDiameter"));
            pipeNetwork.setLayYear(parseInteger(requestData.get("layYear")));
            pipeNetwork.setBuryDepth(parseDouble(requestData.get("buryDepth")));
            pipeNetwork.setPipeMaterial((String) requestData.get("pipeMaterial"));
            pipeNetwork.setRemark((String) requestData.get("remark"));
            
            Long stationId = parseLong(requestData.get("stationId"));
            
            return pipeNetworkService.save(pipeNetwork, stationId);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "更新管网失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/abandon")
    public Map<String, Object> abandonPipeNetwork(
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
            
            return pipeNetworkService.markAsAbandoned(id);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "操作失败");
        }
        
        return result;
    }

    @PutMapping("/{id}/toggle")
    public Map<String, Object> togglePipeNetwork(
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
            
            return pipeNetworkService.toggleActive(id);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "操作失败");
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

    private Double parseDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
