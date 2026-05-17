package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.Room;
import com.healthcare.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room")
public class RoomController {
    @Autowired
    private RoomService roomService;

    @PostMapping
    public Result<Room> save(@RequestBody Room room) {
        try {
            Room saved = roomService.save(room);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        roomService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<Room> getById(@PathVariable Long id) {
        Room room = roomService.findById(id);
        return Result.success(room);
    }

    @GetMapping("/list")
    public Result<List<Room>> list() {
        List<Room> list = roomService.findAll();
        return Result.success(list);
    }

    @GetMapping("/list/enabled")
    public Result<List<Room>> listEnabled() {
        List<Room> list = roomService.findAll();
        List<Room> enabledList = list.stream().filter(r -> r.getStatus() == 1).collect(java.util.stream.Collectors.toList());
        return Result.success(enabledList);
    }

    @GetMapping("/page")
    public Result<Page<Room>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String floorNo,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Long orgId) {
        Page<Room> result = roomService.findPage(page, size, name, roomType, floorNo, status, orgId);
        return Result.success(result);
    }
}