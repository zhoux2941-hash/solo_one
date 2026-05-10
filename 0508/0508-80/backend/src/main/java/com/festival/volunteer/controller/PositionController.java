package com.festival.volunteer.controller;

import com.festival.volunteer.dto.ApiResponse;
import com.festival.volunteer.entity.Position;
import com.festival.volunteer.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PositionController {

    private final PositionService positionService;

    @GetMapping("/list")
    public ApiResponse<List<Position>> list() {
        return ApiResponse.success(positionService.getAllPositions());
    }

    @GetMapping("/active")
    public ApiResponse<List<Position>> active() {
        return ApiResponse.success(positionService.getActivePositions());
    }

    @GetMapping("/{id}")
    public ApiResponse<Position> getById(@PathVariable Long id) {
        try {
            return ApiResponse.success(positionService.getPositionById(id));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
