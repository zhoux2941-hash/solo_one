package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.Workshop;
import com.factory.service.WorkshopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workshop")
public class WorkshopController {

    @Autowired
    private WorkshopService workshopService;

    @GetMapping("/page")
    public Result<Page<Workshop>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return workshopService.findAll(page, size, keyword);
    }

    @GetMapping("/list")
    public Result<List<Workshop>> findAllList() {
        return workshopService.findAllList();
    }

    @GetMapping("/{id}")
    public Result<Workshop> findById(@PathVariable Long id) {
        return workshopService.findById(id);
    }

    @PostMapping
    public Result<Workshop> save(@RequestBody Workshop workshop) {
        return workshopService.save(workshop);
    }

    @PutMapping("/{id}")
    public Result<Workshop> update(@PathVariable Long id, @RequestBody Workshop workshop) {
        return workshopService.update(id, workshop);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return workshopService.delete(id);
    }
}