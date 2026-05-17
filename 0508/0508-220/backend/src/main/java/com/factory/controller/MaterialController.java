package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.Material;
import com.factory.service.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/material")
public class MaterialController {

    @Autowired
    private MaterialService materialService;

    @GetMapping("/page")
    public Result<Page<Material>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type) {
        return materialService.findAll(page, size, keyword, type);
    }

    @GetMapping("/{id}")
    public Result<Material> findById(@PathVariable Long id) {
        return materialService.findById(id);
    }

    @PostMapping
    public Result<Material> save(@RequestBody Material material) {
        return materialService.save(material);
    }

    @PutMapping("/{id}")
    public Result<Material> update(@PathVariable Long id, @RequestBody Material material) {
        return materialService.update(id, material);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return materialService.delete(id);
    }
}