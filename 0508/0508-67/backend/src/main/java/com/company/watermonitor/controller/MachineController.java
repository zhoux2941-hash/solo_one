package com.company.watermonitor.controller;

import com.company.watermonitor.dto.MachineStatusDTO;
import com.company.watermonitor.entity.WaterMachine;
import com.company.watermonitor.entity.WaterRecord;
import com.company.watermonitor.service.WaterMachineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final WaterMachineService machineService;

    @GetMapping
    public ResponseEntity<List<WaterMachine>> getAllMachines() {
        return ResponseEntity.ok(machineService.getAllMachines());
    }

    @GetMapping("/{machineId}")
    public ResponseEntity<WaterMachine> getMachineById(@PathVariable Long machineId) {
        WaterMachine machine = machineService.getMachineById(machineId);
        if (machine == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(machine);
    }

    @PostMapping
    public ResponseEntity<WaterMachine> createMachine(@RequestBody WaterMachine machine) {
        WaterMachine saved = machineService.saveMachine(machine);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/status")
    public ResponseEntity<List<MachineStatusDTO>> getAllStatuses() {
        return ResponseEntity.ok(machineService.getAllMachineStatuses());
    }

    @GetMapping("/{machineId}/history")
    public ResponseEntity<List<WaterRecord>> getMachineHistory(@PathVariable Long machineId) {
        return ResponseEntity.ok(machineService.getMachineHistory(machineId));
    }

    @PostMapping("/{machineId}/simulate")
    public ResponseEntity<Void> simulateReport(@PathVariable Long machineId) {
        WaterMachine machine = machineService.getMachineById(machineId);
        if (machine != null) {
            machineService.simulateWaterReport(machine);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{machineId}/refil")
    public ResponseEntity<Void> refilMachine(@PathVariable Long machineId) {
        machineService.refilMachine(machineId);
        return ResponseEntity.ok().build();
    }
}
