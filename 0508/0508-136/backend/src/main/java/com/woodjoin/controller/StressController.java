package com.woodjoin.controller;

import com.woodjoin.dto.StressSimulationDTO;
import com.woodjoin.service.StressSimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stress")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StressController {

    private final StressSimulationService stressSimulationService;

    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulate(@Valid @RequestBody StressSimulationDTO dto) {
        JoinParamsDTO params = convertToJoinParams(dto);
        Map<String, Object> result = stressSimulationService.simulateStress(
                params,
                dto.getLoadForce(),
                dto.getLoadDirection()
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/directions")
    public ResponseEntity<java.util.List<Map<String, String>>> getLoadDirections() {
        java.util.List<Map<String, String>> directions = java.util.Arrays.asList(
                createDirection("TENSION", "拉伸载荷", "沿榫卯轴线方向拉伸"),
                createDirection("COMPRESSION", "压缩载荷", "沿榫卯轴线方向压缩"),
                createDirection("SHEAR", "剪切载荷", "垂直于榫卯轴线方向剪切"),
                createDirection("BENDING", "弯曲载荷", "垂直于榫卯轴线方向弯曲")
        );
        return ResponseEntity.ok(directions);
    }

    private Map<String, String> createDirection(String code, String name, String desc) {
        Map<String, String> dir = new HashMap<>();
        dir.put("code", code);
        dir.put("name", name);
        dir.put("description", desc);
        return dir;
    }

    private JoinParamsDTO convertToJoinParams(StressSimulationDTO dto) {
        JoinParamsDTO params = new JoinParamsDTO();
        params.setJoinType(dto.getJoinType());
        params.setWoodLength(dto.getWoodLength());
        params.setWoodWidth(dto.getWoodWidth());
        params.setWoodHeight(dto.getWoodHeight());
        params.setTenonLength(dto.getTenonLength());
        params.setTenonWidth(dto.getTenonWidth());
        params.setTenonHeight(dto.getTenonHeight());
        params.setMargin(dto.getMargin());
        return params;
    }
}

@lombok.Data
class JoinParamsDTO {
    private com.woodjoin.enums.JoinType joinType;
    private Double woodLength;
    private Double woodWidth;
    private Double woodHeight;
    private Double tenonLength;
    private Double tenonWidth;
    private Double tenonHeight;
    private Double margin;
}