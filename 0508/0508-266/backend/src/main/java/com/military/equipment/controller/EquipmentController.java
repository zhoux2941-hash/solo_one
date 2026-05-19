package com.military.equipment.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.military.equipment.annotation.RequiresRoles;
import com.military.equipment.common.PageQuery;
import com.military.equipment.common.Result;
import com.military.equipment.entity.Equipment;
import com.military.equipment.service.EquipmentService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/equipment")
public class EquipmentController {

    @Resource
    private EquipmentService equipmentService;

    @GetMapping("/list")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<Page<Equipment>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer secretLevel,
            PageQuery pageQuery) {
        return Result.success(equipmentService.list(keyword, status, secretLevel, pageQuery));
    }

    @GetMapping("/{id}")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<Equipment> getById(@PathVariable Long id) {
        return Result.success(equipmentService.getById(id));
    }

    @PostMapping
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER"})
    public Result<?> add(@RequestBody Equipment equipment) {
        equipmentService.add(equipment);
        return Result.success();
    }

    @PutMapping
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER"})
    public Result<?> update(@RequestBody Equipment equipment) {
        equipmentService.update(equipment);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @RequiresRoles({"ADMIN"})
    public Result<?> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return Result.success();
    }

    @GetMapping("/export")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR"})
    public Result<List<Equipment>> export(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer secretLevel) {
        return Result.success(equipmentService.export(keyword, status, secretLevel));
    }
}
