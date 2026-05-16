package com.hrbonus.controller;

import com.hrbonus.dto.BatchAllocationRequest;
import com.hrbonus.dto.VersionDiff;
import com.hrbonus.entity.BonusAllocation;
import com.hrbonus.entity.BonusVersion;
import com.hrbonus.service.BonusAllocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/allocations")
public class BonusAllocationController {

    @Autowired
    private BonusAllocationService allocationService;

    @PostMapping("/batch")
    public ResponseEntity<List<BonusAllocation>> batchAllocate(@RequestBody BatchAllocationRequest request) {
        return ResponseEntity.ok(allocationService.batchAllocate(request));
    }

    @GetMapping("/pool/{poolId}")
    public ResponseEntity<List<BonusAllocation>> getByPool(@PathVariable Long poolId) {
        return ResponseEntity.ok(allocationService.getPoolAllocations(poolId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<BonusAllocation>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(allocationService.getEmployeeAllocations(employeeId));
    }

    @GetMapping("/{allocationId}/versions")
    public ResponseEntity<List<BonusVersion>> getVersions(@PathVariable Long allocationId) {
        return ResponseEntity.ok(allocationService.getAllocationVersions(allocationId));
    }

    @GetMapping("/{allocationId}/diff")
    public ResponseEntity<List<VersionDiff>> compareVersions(
            @PathVariable Long allocationId,
            @RequestParam Integer v1,
            @RequestParam Integer v2) {
        return ResponseEntity.ok(allocationService.compareVersions(allocationId, v1, v2));
    }

    @PutMapping("/{allocationId}/confirm")
    public ResponseEntity<BonusAllocation> confirm(@PathVariable Long allocationId) {
        return ResponseEntity.ok(allocationService.confirmAllocation(allocationId));
    }
}
