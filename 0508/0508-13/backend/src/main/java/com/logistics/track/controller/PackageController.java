package com.logistics.track.controller;

import com.logistics.track.dto.PackageDTO;
import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.service.PackageService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @GetMapping
    public ResponseEntity<List<PackageDTO>> getAllPackages() {
        return ResponseEntity.ok(packageService.getAllPackages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackageDTO> getPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(packageService.getPackageById(id));
    }

    @GetMapping("/no/{packageNo}")
    public ResponseEntity<PackageDTO> getPackageByNo(@PathVariable String packageNo) {
        return ResponseEntity.ok(packageService.getPackageByNo(packageNo));
    }

    @PostMapping
    public ResponseEntity<Package> createPackage(@RequestBody CreatePackageRequest request) {
        return ResponseEntity.ok(packageService.createPackage(request.getPkg(), request.getInitialTrack()));
    }

    @Data
    public static class CreatePackageRequest {
        private Package pkg;
        private Track initialTrack;
    }
}
