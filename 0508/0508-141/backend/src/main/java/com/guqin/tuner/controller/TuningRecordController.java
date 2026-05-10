package com.guqin.tuner.controller;

import com.guqin.tuner.entity.TuningRecord;
import com.guqin.tuner.entity.TuningRecordCreateDTO;
import com.guqin.tuner.service.TuningRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tuning-record")
@CrossOrigin(origins = "*")
public class TuningRecordController {

    @Autowired
    private TuningRecordService tuningRecordService;

    @GetMapping("/list/{guqinId}")
    public ResponseEntity<Map<String, Object>> getByGuqinId(@PathVariable Long guqinId) {
        List<TuningRecord> records = tuningRecordService.getRecordsByGuqinId(guqinId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", records);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> record = tuningRecordService.getRecordWithDetails(id);
        
        if (record != null) {
            response.put("success", true);
            response.put("data", record);
        } else {
            response.put("success", false);
            response.put("message", "记录不存在");
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody TuningRecordCreateDTO dto) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> saved = tuningRecordService.createTuningRecord(dto);
            response.put("success", true);
            response.put("data", saved);
            response.put("message", "保存成功");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "保存失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        boolean deleted = tuningRecordService.deleteTuningRecord(id);
        
        if (deleted) {
            response.put("success", true);
            response.put("message", "删除成功");
        } else {
            response.put("success", false);
            response.put("message", "记录不存在");
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/latest-curve/{guqinId}")
    public ResponseEntity<Map<String, Object>> getLatestCurve(@PathVariable Long guqinId) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> curve = tuningRecordService.getLatestCurve(guqinId);
        
        if (curve != null) {
            response.put("success", true);
            response.put("data", curve);
        } else {
            response.put("success", false);
            response.put("message", "暂无调音记录");
        }
        
        return ResponseEntity.ok(response);
    }
}
