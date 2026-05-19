package com.industrial.workorder.controller;

import com.industrial.workorder.entity.Device;
import com.industrial.workorder.service.DeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    @GetMapping
    public List<Device> findAll() {
        return deviceService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Device> findById(@PathVariable Long id) {
        Optional<Device> device = deviceService.findById(id);
        return device.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Device> findByDeviceCode(@PathVariable String code) {
        Optional<Device> device = deviceService.findByDeviceCode(code);
        return device.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/productionLine/{line}")
    public List<Device> findByProductionLine(@PathVariable String line) {
        return deviceService.findByProductionLine(line);
    }

    @GetMapping("/status/{status}")
    public List<Device> findByStatus(@PathVariable String status) {
        return deviceService.findByStatus(status);
    }

    @PostMapping
    public Device create(@RequestBody Device device) {
        return deviceService.save(device);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Device> update(@PathVariable Long id, @RequestBody Device device) {
        if (!deviceService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        device.setId(id);
        return ResponseEntity.ok(deviceService.save(device));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Device> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
        String status = statusMap.get("status");
        Device updated = deviceService.updateStatus(id, status);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!deviceService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        deviceService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
