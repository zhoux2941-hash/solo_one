package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.Organization;
import com.healthcare.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organization")
public class OrganizationController {
    @Autowired
    private OrganizationService organizationService;

    @PostMapping
    public Result<Organization> save(@RequestBody Organization organization) {
        try {
            Organization saved = organizationService.save(organization);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        organizationService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<Organization> getById(@PathVariable Long id) {
        Organization organization = organizationService.findById(id);
        return Result.success(organization);
    }

    @GetMapping("/list")
    public Result<List<Organization>> list() {
        List<Organization> list = organizationService.findAll();
        return Result.success(list);
    }

    @GetMapping("/parent/{parentId}")
    public Result<List<Organization>> listByParentId(@PathVariable Long parentId) {
        List<Organization> list = organizationService.findByParentId(parentId);
        return Result.success(list);
    }

    @GetMapping("/page")
    public Result<Page<Organization>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {
        Page<Organization> result = organizationService.findPage(page, size, name, type, status);
        return Result.success(result);
    }
}