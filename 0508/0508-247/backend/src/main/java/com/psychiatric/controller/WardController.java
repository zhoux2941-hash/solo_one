package com.psychiatric.controller;

import com.psychiatric.entity.Ward;
import com.psychiatric.service.WardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wards")
@CrossOrigin(origins = "*")
public class WardController {
    
    @Autowired
    private WardService wardService;
    
    @GetMapping
    public List<Ward> getAllWards() {
        return wardService.getAllWards();
    }
    
    @GetMapping("/{wardNumber}")
    public ResponseEntity<Ward> getWardByNumber(@PathVariable String wardNumber) {
        return wardService.getWardByNumber(wardNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Ward createWard(@RequestBody Ward ward) {
        return wardService.saveWard(ward);
    }
    
    @PostMapping("/{wardNumber}/unlock")
    public ResponseEntity<Ward> unlockDoor(@PathVariable String wardNumber,
                                            @RequestBody Map<String, String> request) {
        String operator = request.get("operator");
        String reason = request.get("reason");
        Ward ward = wardService.unlockDoor(wardNumber, operator, reason);
        return ward != null ? ResponseEntity.ok(ward) : ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{wardNumber}/lock")
    public ResponseEntity<Ward> lockDoor(@PathVariable String wardNumber) {
        Ward ward = wardService.lockDoor(wardNumber);
        return ward != null ? ResponseEntity.ok(ward) : ResponseEntity.notFound().build();
    }
}
