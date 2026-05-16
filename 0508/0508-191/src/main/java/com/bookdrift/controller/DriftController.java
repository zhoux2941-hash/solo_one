package com.bookdrift.controller;

import com.bookdrift.entity.Drift;
import com.bookdrift.service.DriftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drifts")
@CrossOrigin(origins = "*")
public class DriftController {

    @Autowired
    private DriftService driftService;

    @PostMapping
    public ResponseEntity<?> requestDrift(@RequestBody Drift drift) {
        try {
            Drift newDrift = driftService.requestDrift(drift);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "申请成功");
            result.put("data", newDrift);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmDrift(@PathVariable Long id) {
        try {
            Drift drift = driftService.confirmDrift(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "确认成功");
            result.put("data", drift);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectDrift(@PathVariable Long id) {
        try {
            Drift drift = driftService.rejectDrift(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "已拒绝");
            result.put("data", drift);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeDrift(@PathVariable Long id) {
        try {
            Drift drift = driftService.completeDrift(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "归还成功");
            result.put("data", drift);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<?> getByRequesterId(@PathVariable Long requesterId) {
        List<Drift> drifts = driftService.findByRequesterId(requesterId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", drifts);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getByOwnerId(@PathVariable Long ownerId) {
        List<Drift> drifts = driftService.findByOwnerId(ownerId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", drifts);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/active/{requesterId}")
    public ResponseEntity<?> getActiveDrifts(@PathVariable Long requesterId) {
        List<Drift> drifts = driftService.findActiveDriftsByRequesterId(requesterId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", drifts);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Drift drift = driftService.findById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", drift);
        return ResponseEntity.ok(result);
    }
}
