package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.CareItem;
import com.healthcare.service.CareItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/care-item")
public class CareItemController {
    @Autowired
    private CareItemService careItemService;

    @PostMapping
    public Result<CareItem> save(@RequestBody CareItem careItem) {
        try {
            CareItem saved = careItemService.save(careItem);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        careItemService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<CareItem> getById(@PathVariable Long id) {
        CareItem careItem = careItemService.findById(id);
        return Result.success(careItem);
    }

    @GetMapping("/page")
    public Result<Page<CareItem>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String category) {
        Page<CareItem> result = careItemService.findPage(page, size, itemName, category);
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<CareItem>> list() {
        List<CareItem> result = careItemService.findAll();
        return Result.success(result);
    }
}
