package com.library.recommendation.controller;

import com.library.recommendation.common.Result;
import com.library.recommendation.entity.Reader;
import com.library.recommendation.service.ReaderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/readers")
@Tag(name = "读者管理", description = "读者相关接口")
public class ReaderController {

    private final ReaderService readerService;

    public ReaderController(ReaderService readerService) {
        this.readerService = readerService;
    }

    @GetMapping
    @Operation(summary = "获取所有读者列表")
    public Result<List<Reader>> list() {
        return Result.success(readerService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取读者信息")
    public Result<Reader> getById(@PathVariable Long id) {
        return Result.success(readerService.getById(id));
    }

    @PostMapping
    @Operation(summary = "新增读者")
    public Result<Reader> save(@RequestBody Reader reader) {
        return Result.success(readerService.save(reader));
    }

    @PutMapping
    @Operation(summary = "更新读者信息")
    public Result<Reader> update(@RequestBody Reader reader) {
        return Result.success(readerService.update(reader));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除读者")
    public Result<Void> delete(@PathVariable Long id) {
        readerService.delete(id);
        return Result.success();
    }
}
