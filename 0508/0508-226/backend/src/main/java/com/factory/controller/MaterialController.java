package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.Material;
import com.factory.service.MaterialService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/material")
public class MaterialController {

    private static final Logger logger = LoggerFactory.getLogger(MaterialController.class);

    @Autowired
    private MaterialService materialService;

    @GetMapping("/page")
    public Result<Page<Material>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type) {
        logger.info("查询物料列表 - page: {}, size: {}, keyword: {}, type: {}", page, size, keyword, type);
        return materialService.findAll(page, size, keyword, type);
    }

    @GetMapping("/{id}")
    public Result<Material> findById(@PathVariable Long id) {
        logger.info("查询物料详情 - id: {}", id);
        return materialService.findById(id);
    }

    @PostMapping
    public Result<Material> save(@RequestBody Material material) {
        logger.info("新增物料 - materialCode: {}, materialName: {}", material.getMaterialCode(), material.getMaterialName());
        return materialService.save(material);
    }

    @PutMapping("/{id}")
    public Result<Material> update(@PathVariable Long id, @RequestBody Material material) {
        logger.info("更新物料 - id: {}, materialCode: {}, materialName: {}", id, material.getMaterialCode(), material.getMaterialName());
        return materialService.update(id, material);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        logger.info("删除物料 - id: {}", id);
        return materialService.delete(id);
    }
}