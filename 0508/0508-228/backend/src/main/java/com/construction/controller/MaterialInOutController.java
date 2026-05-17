package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.MaterialInOut;
import com.construction.entity.MaterialInventory;
import com.construction.service.MaterialInOutService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/material-inout")
public class MaterialInOutController {

    @Resource
    private MaterialInOutService materialInOutService;

    @GetMapping("/list")
    public Result<PageResult<MaterialInOut>> getInOutList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String billType,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long materialId) {
        return materialInOutService.getInOutList(pageNum, pageSize, billType, projectId, materialId);
    }

    @GetMapping("/{id}")
    public Result<MaterialInOut> getInOutById(@PathVariable Long id) {
        return materialInOutService.getInOutById(id);
    }

    @PostMapping
    public Result<MaterialInOut> createInOut(@RequestBody MaterialInOut inOut) {
        return materialInOutService.createInOut(inOut);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteInOut(@PathVariable Long id) {
        return materialInOutService.deleteInOut(id);
    }

    @GetMapping("/inventory")
    public Result<List<MaterialInventory>> getInventoryList(
            @RequestParam Long projectId,
            @RequestParam(required = false) Boolean lowStockOnly) {
        return materialInOutService.getInventoryList(projectId, lowStockOnly);
    }

    @GetMapping("/inventory/{materialId}")
    public Result<MaterialInventory> getInventoryByMaterialId(@PathVariable Long materialId) {
        return materialInOutService.getInventoryByMaterialId(materialId);
    }
}
