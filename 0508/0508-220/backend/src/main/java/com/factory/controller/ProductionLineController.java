package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.ProductionLine;
import com.factory.service.ProductionLineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/production-line")
public class ProductionLineController {

    @Autowired
    private ProductionLineService productionLineService;

    @GetMapping("/page")
    public Result<Page<ProductionLine>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return productionLineService.findAll(page, size, keyword);
    }

    @GetMapping("/workshop/{workshopId}")
    public Result<List<ProductionLine>> findByWorkshopId(@PathVariable Long workshopId) {
        return productionLineService.findByWorkshopId(workshopId);
    }

    @GetMapping("/{id}")
    public Result<ProductionLine> findById(@PathVariable Long id) {
        return productionLineService.findById(id);
    }

    @PostMapping
    public Result<ProductionLine> save(@RequestBody ProductionLine line) {
        return productionLineService.save(line);
    }

    @PutMapping("/{id}")
    public Result<ProductionLine> update(@PathVariable Long id, @RequestBody ProductionLine line) {
        return productionLineService.update(id, line);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return productionLineService.delete(id);
    }
}