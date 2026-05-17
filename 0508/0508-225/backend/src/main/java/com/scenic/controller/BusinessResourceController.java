package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.BusinessResource;
import com.scenic.service.BusinessResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resource")
public class BusinessResourceController {

    @Autowired
    private BusinessResourceService resourceService;

    @PostMapping
    public Result<BusinessResource> save(@RequestBody BusinessResource resource) {
        Map<String, Object> result = resourceService.save(resource);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (BusinessResource) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = resourceService.delete(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<BusinessResource> getById(@PathVariable Long id) {
        return resourceService.findById(id)
                .map(Result::success)
                .orElse(Result.error("资源不存在"));
    }

    @GetMapping("/list")
    public Result<List<BusinessResource>> list() {
        return Result.success(resourceService.findAll());
    }

    @GetMapping("/page")
    public Result<Page<BusinessResource>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        return Result.success(resourceService.findByPage(keyword, categoryId, status, pageable));
    }
}
