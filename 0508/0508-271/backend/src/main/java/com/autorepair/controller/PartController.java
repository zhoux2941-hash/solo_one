package com.autorepair.controller;

import com.autorepair.common.Result;
import com.autorepair.entity.Part;
import com.autorepair.service.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/part")
public class PartController {
    @Autowired
    private PartService partService;
    
    @GetMapping("/list")
    public Result<List<Part>> list() {
        return Result.success(partService.list());
    }
    
    @GetMapping("/search")
    public Result<List<Part>> search(@RequestParam String keyword) {
        return Result.success(partService.search(keyword));
    }
    
    @GetMapping("/warning")
    public Result<List<Part>> getWarningStock() {
        return Result.success(partService.getWarningStock());
    }
    
    @GetMapping("/{id}")
    public Result<Part> getById(@PathVariable Long id) {
        return Result.success(partService.getById(id));
    }
    
    @PostMapping("/save")
    public Result<Part> save(@RequestBody Part part) {
        return Result.success(partService.save(part));
    }
    
    @PostMapping("/stockIn/{id}")
    public Result<Part> stockIn(@PathVariable Long id, @RequestParam Integer quantity) {
        return Result.success(partService.stockIn(id, quantity));
    }
    
    @PostMapping("/stockOut/{id}")
    public Result<Part> stockOut(@PathVariable Long id, @RequestParam Integer quantity) {
        return Result.success(partService.stockOut(id, quantity));
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        partService.delete(id);
        return Result.success();
    }
}