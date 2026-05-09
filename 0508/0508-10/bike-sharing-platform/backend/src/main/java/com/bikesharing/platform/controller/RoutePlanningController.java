package com.bikesharing.platform.controller;

import com.bikesharing.platform.dto.RoutePlanDTO;
import com.bikesharing.platform.service.RoutePlanningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/routing")
@RequiredArgsConstructor
public class RoutePlanningController {

    private final RoutePlanningService routePlanningService;

    @PostMapping("/optimize")
    public ResponseEntity<RoutePlanDTO> optimizeRoutes() {
        log.info("Received route optimization request");
        RoutePlanDTO plan = routePlanningService.optimizeRoutes();
        return ResponseEntity.ok(plan);
    }
}
