package com.hrbonus.controller;

import com.hrbonus.entity.BonusPool;
import com.hrbonus.service.BonusPoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bonus-pools")
public class BonusPoolController {

    @Autowired
    private BonusPoolService bonusPoolService;

    @PostMapping
    public ResponseEntity<BonusPool> create(@RequestBody BonusPool pool) {
        return ResponseEntity.ok(bonusPoolService.createBonusPool(pool));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<BonusPool>> getByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(bonusPoolService.getDepartmentPools(departmentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BonusPool> getById(@PathVariable Long id) {
        return bonusPoolService.getPoolById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BonusPool> updateStatus(
            @PathVariable Long id,
            @RequestParam BonusPool.PoolStatus status) {
        return ResponseEntity.ok(bonusPoolService.updatePoolStatus(id, status));
    }
}
