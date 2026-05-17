package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.Position;
import com.scenic.service.PositionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/position")
public class PositionController {

    @Autowired
    private PositionService positionService;

    @PostMapping
    public Result<Position> save(@RequestBody Position position) {
        Map<String, Object> result = positionService.save(position);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Position) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = positionService.delete(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<Position> getById(@PathVariable Long id) {
        return positionService.findById(id)
                .map(Result::success)
                .orElse(Result.error("岗位不存在"));
    }

    @GetMapping("/list")
    public Result<List<Position>> list() {
        return Result.success(positionService.findAll());
    }

    @GetMapping("/active")
    public Result<List<Position>> active() {
        return Result.success(positionService.findActive());
    }

    @GetMapping("/page")
    public Result<Page<Position>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("level").ascending().and(Sort.by("id").descending()));
        return Result.success(positionService.findByPage(keyword, pageable));
    }
}
