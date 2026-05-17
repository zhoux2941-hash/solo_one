package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.Bed;
import com.healthcare.service.BedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bed")
public class BedController {
    @Autowired
    private BedService bedService;

    @PostMapping
    public Result<Bed> save(@RequestBody Bed bed) {
        try {
            Bed saved = bedService.save(bed);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        bedService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<Bed> getById(@PathVariable Long id) {
        Bed bed = bedService.findById(id);
        return Result.success(bed);
    }

    @GetMapping("/room/{roomId}")
    public Result<List<Bed>> listByRoomId(@PathVariable Long roomId) {
        List<Bed> list = bedService.findByRoomId(roomId);
        return Result.success(list);
    }

    @GetMapping("/page")
    public Result<Page<Bed>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String bedNo,
            @RequestParam(required = false) String bedType,
            @RequestParam(required = false) String bedStatus,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long orgId) {
        Page<Bed> result = bedService.findPage(page, size, bedNo, bedType, bedStatus, roomId, orgId);
        return Result.success(result);
    }
}