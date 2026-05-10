package com.bus.scheduling.controller;

import com.bus.scheduling.dto.DriverEnergyDTO;
import com.bus.scheduling.entity.Driver;
import com.bus.scheduling.service.DriverService;
import com.bus.scheduling.service.EnergyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;
    private final EnergyService energyService;

    @GetMapping
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long id) {
        Driver driver = driverService.getDriverById(id);
        return driver != null ? ResponseEntity.ok(driver) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/energy")
    public ResponseEntity<Integer> getDriverEnergy(@PathVariable Long id) {
        return ResponseEntity.ok(energyService.getCurrentEnergy(id));
    }

    @GetMapping("/energies")
    public ResponseEntity<List<DriverEnergyDTO>> getAllEnergies() {
        return ResponseEntity.ok(energyService.getAllDriverEnergies());
    }

    @PostMapping("/reset-energies")
    public ResponseEntity<Void> resetAllEnergies() {
        energyService.resetAllEnergies();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/energy/{value}")
    public ResponseEntity<Void> setDriverEnergy(@PathVariable Long id, @PathVariable Integer value) {
        energyService.setCurrentEnergy(id, value);
        return ResponseEntity.ok().build();
    }
}
