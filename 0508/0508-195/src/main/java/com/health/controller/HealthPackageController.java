package com.health.controller;

import com.health.entity.HealthPackage;
import com.health.service.HealthPackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@CrossOrigin(origins = "*")
public class HealthPackageController {

    @Autowired
    private HealthPackageService packageService;

    @GetMapping
    public ResponseEntity<List<HealthPackage>> getAllPackages() {
        return ResponseEntity.ok(packageService.getAllPackages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HealthPackage> getPackageById(@PathVariable Long id) {
        HealthPackage pkg = packageService.getPackageById(id);
        if (pkg == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(pkg);
    }
}
