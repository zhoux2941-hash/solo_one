package com.example.trashbin.controller;

import com.example.trashbin.common.Result;
import com.example.trashbin.dto.GarbageThrowDTO;
import com.example.trashbin.entity.GarbageRecord;
import com.example.trashbin.service.GarbageRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/garbage")
public class GarbageRecordController {

    @Autowired
    private GarbageRecordService garbageRecordService;

    @PostMapping("/throw")
    public Result<Integer> throwGarbage(@Validated @RequestBody GarbageThrowDTO dto) {
        try {
            Integer pointsEarned = garbageRecordService.throwGarbage(dto);
            return Result.success(pointsEarned);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/records/{residentId}")
    public Result<List<GarbageRecord>> getRecords(@PathVariable Long residentId) {
        return Result.success(garbageRecordService.getByResidentId(residentId));
    }
}
