package com.buscompany.fatigue.controller;

import com.buscompany.fatigue.entity.Driver;
import com.buscompany.fatigue.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {
    @Autowired
    private DriverRepository driverRepository;

    @GetMapping
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverRepository.findAll());
    }

    @GetMapping("/online")
    public ResponseEntity<List<Driver>> getOnlineDrivers() {
        return ResponseEntity.ok(driverRepository.findByOnlineTrue());
    }

    @GetMapping("/{driverNo}")
    public ResponseEntity<Driver> getDriverByNo(@PathVariable String driverNo) {
        Optional<Driver> driver = driverRepository.findByDriverNo(driverNo);
        return driver.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        driver.setId(null);
        return ResponseEntity.ok(driverRepository.save(driver));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        if (!driverRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        driver.setId(id);
        return ResponseEntity.ok(driverRepository.save(driver));
    }
}
