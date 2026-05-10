package com.mineral.identification.controller;

import com.mineral.identification.dto.IdentificationConfirmationRequest;
import com.mineral.identification.dto.MineralIdentificationRequest;
import com.mineral.identification.dto.MineralMatchResult;
import com.mineral.identification.entity.Mineral;
import com.mineral.identification.service.MineralService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/minerals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MineralController {
    
    private final MineralService mineralService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMinerals() {
        List<Mineral> minerals = mineralService.getAllMinerals();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", minerals);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMineralById(@PathVariable Long id) {
        Mineral mineral = mineralService.getMineralById(id);
        Map<String, Object> response = new HashMap<>();
        
        if (mineral != null) {
            response.put("success", true);
            response.put("data", mineral);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "矿物不存在");
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/identify")
    public ResponseEntity<Map<String, Object>> identifyMinerals(@RequestBody MineralIdentificationRequest request) {
        List<MineralMatchResult> results = mineralService.identifyMinerals(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", results);
        response.put("count", results.size());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmIdentification(
            @Validated @RequestBody IdentificationConfirmationRequest request,
            HttpServletRequest httpRequest) {
        boolean success = mineralService.confirmIdentification(request, httpRequest);
        Map<String, Object> response = new HashMap<>();
        
        if (success) {
            response.put("success", true);
            response.put("message", "鉴定确认已记录");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "记录失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/feature-options")
    public ResponseEntity<Map<String, Object>> getFeatureOptions() {
        Map<String, Object> options = new HashMap<>();
        
        Map<String, String> streaks = new LinkedHashMap<>();
        streaks.put("white", "白色");
        streaks.put("gray", "灰色");
        streaks.put("black", "黑色");
        streaks.put("reddish_brown", "红褐色");
        streaks.put("red", "红色");
        streaks.put("yellow", "黄色");
        streaks.put("green", "绿色");
        streaks.put("blue", "蓝色");
        streaks.put("colorless", "无色");
        streaks.put("brown", "褐色");
        options.put("streaks", streaks);
        
        Map<String, String> lusters = new LinkedHashMap<>();
        lusters.put("metallic", "金属光泽");
        lusters.put("glassy", "玻璃光泽");
        lusters.put("greasy", "油脂光泽");
        lusters.put("pearly", "珍珠光泽");
        lusters.put("dull", "暗淡光泽");
        lusters.put("earthy", "土状光泽");
        lusters.put("silky", "丝绢光泽");
        lusters.put("adamantine", "金刚光泽");
        lusters.put("resinous", "树脂光泽");
        lusters.put("submetallic", "半金属光泽");
        options.put("lusters", lusters);
        
        Map<String, String> cleavages = new LinkedHashMap<>();
        cleavages.put("perfect", "完全解理");
        cleavages.put("good", "良好解理");
        cleavages.put("distinct", "明显解理");
        cleavages.put("indistinct", "不明显解理");
        cleavages.put("absent", "无解理");
        cleavages.put("basal", "底面解理");
        cleavages.put("prismatic", "柱状解理");
        cleavages.put("cubic", "立方体解理");
        cleavages.put("octahedral", "八面体解理");
        cleavages.put("rhombohedral", "菱面体解理");
        options.put("cleavages", cleavages);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", options);
        return ResponseEntity.ok(response);
    }
}
