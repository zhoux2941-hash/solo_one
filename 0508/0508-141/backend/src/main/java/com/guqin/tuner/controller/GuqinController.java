package com.guqin.tuner.controller;

import com.guqin.tuner.entity.Guqin;
import com.guqin.tuner.service.GuqinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/guqin")
@CrossOrigin(origins = "*")
public class GuqinController {

    @Autowired
    private GuqinService guqinService;

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getList() {
        List<Guqin> guqins = guqinService.getAllGuqins();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", guqins);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        Optional<Guqin> guqinOpt = guqinService.getGuqinById(id);
        Map<String, Object> response = new HashMap<>();
        
        if (guqinOpt.isPresent()) {
            response.put("success", true);
            response.put("data", guqinOpt.get());
        } else {
            response.put("success", false);
            response.put("message", "古琴不存在");
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Guqin guqin) {
        Map<String, Object> response = new HashMap<>();
        try {
            Guqin saved = guqinService.createGuqin(guqin);
            response.put("success", true);
            response.put("data", saved);
            response.put("message", "创建成功");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "创建失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody Guqin guqinDetails) {
        Map<String, Object> response = new HashMap<>();
        Optional<Guqin> updated = guqinService.updateGuqin(id, guqinDetails);
        
        if (updated.isPresent()) {
            response.put("success", true);
            response.put("data", updated.get());
            response.put("message", "更新成功");
        } else {
            response.put("success", false);
            response.put("message", "古琴不存在");
        }
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        boolean deleted = guqinService.deleteGuqin(id);
        
        if (deleted) {
            response.put("success", true);
            response.put("message", "删除成功");
        } else {
            response.put("success", false);
            response.put("message", "古琴不存在");
        }
        
        return ResponseEntity.ok(response);
    }
}
