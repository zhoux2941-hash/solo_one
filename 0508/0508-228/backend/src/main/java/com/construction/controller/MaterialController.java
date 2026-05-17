package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.Material;
import com.construction.service.MaterialService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/material")
public class MaterialController {

    @Resource
    private MaterialService materialService;

    @GetMapping("/list")
    public Result<PageResult<Material>> getMaterialList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) Long projectId) {
        return materialService.getMaterialList(pageNum, pageSize, keyword, materialType, projectId);
    }

    @GetMapping("/{id}")
    public Result<Material> getMaterialById(@PathVariable Long id) {
        return materialService.getMaterialById(id);
    }

    @PostMapping
    public Result<Material> addMaterial(@RequestBody Material material) {
        return materialService.addMaterial(material);
    }

    @PutMapping("/{id}")
    public Result<Material> updateMaterial(@PathVariable Long id, @RequestBody Material material) {
        return materialService.updateMaterial(id, material);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteMaterial(@PathVariable Long id) {
        return materialService.deleteMaterial(id);
    }

    @GetMapping("/project/{projectId}")
    public Result<List<Material>> getMaterialsByProjectId(@PathVariable Long projectId) {
        return materialService.getMaterialsByProjectId(projectId);
    }
}
