package com.example.trashbin.controller;

import com.example.trashbin.common.Result;
import com.example.trashbin.dto.ResidentRegisterDTO;
import com.example.trashbin.entity.Resident;
import com.example.trashbin.service.ResidentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resident")
public class ResidentController {

    @Autowired
    private ResidentService residentService;

    @PostMapping("/register")
    public Result<Resident> register(@Validated @RequestBody ResidentRegisterDTO dto) {
        try {
            Resident resident = residentService.register(dto);
            return Result.success(resident);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/list")
    public Result<List<Resident>> list() {
        return Result.success(residentService.listAll());
    }

    @GetMapping("/{id}")
    public Result<Resident> getById(@PathVariable Long id) {
        try {
            Resident resident = residentService.getByIdWithPoints(id);
            return Result.success(resident);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/points")
    public Result<Integer> getPoints(@PathVariable Long id) {
        try {
            Integer points = residentService.getCurrentPoints(id);
            return Result.success(points);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
