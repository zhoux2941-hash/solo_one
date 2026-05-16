package com.hrbonus.controller;

import com.hrbonus.dto.AppealRequest;
import com.hrbonus.dto.ProcessAppealRequest;
import com.hrbonus.entity.Appeal;
import com.hrbonus.service.AppealService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appeals")
public class AppealController {

    @Autowired
    private AppealService appealService;

    @PostMapping
    public ResponseEntity<Appeal> create(@RequestBody AppealRequest request) {
        return ResponseEntity.ok(appealService.createAppeal(request));
    }

    @PostMapping("/process")
    public ResponseEntity<Appeal> process(@RequestBody ProcessAppealRequest request) {
        return ResponseEntity.ok(appealService.processAppeal(request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Appeal>> getPending() {
        return ResponseEntity.ok(appealService.getPendingAppeals());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Appeal>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(appealService.getEmployeeAppeals(employeeId));
    }
}
