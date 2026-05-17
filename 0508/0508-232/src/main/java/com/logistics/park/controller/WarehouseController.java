package com.logistics.park.controller;

import com.logistics.park.dto.Result;
import com.logistics.park.entity.Role;
import com.logistics.park.entity.User;
import com.logistics.park.entity.Warehouse;
import com.logistics.park.entity.WarehouseArea;
import com.logistics.park.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse")
@Validated
public class WarehouseController {

    @Autowired
    private WarehouseService warehouseService;

    @PostMapping
    public Result<Warehouse> createWarehouse(@Valid @RequestBody Warehouse warehouse, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        if (!Role.ADMIN.equals(currentUser.getRole()) && !Role.WAREHOUSE_KEEPER.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            Warehouse created = warehouseService.createWarehouse(warehouse);
            return Result.success("创建成功", created);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Result<Warehouse> updateWarehouse(@PathVariable Long id, @Valid @RequestBody Warehouse warehouse, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        if (!Role.ADMIN.equals(currentUser.getRole()) && !Role.WAREHOUSE_KEEPER.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            Warehouse updated = warehouseService.updateWarehouse(id, warehouse);
            return Result.success("更新成功", updated);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteWarehouse(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        if (!Role.ADMIN.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            warehouseService.deleteWarehouse(id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<Warehouse> getWarehouseById(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        Warehouse warehouse = warehouseService.getWarehouseById(id);
        if (warehouse != null) {
            return Result.success(warehouse);
        }
        return Result.error("仓库不存在");
    }

    @GetMapping("/page")
    public Result<Page<Warehouse>> getWarehouses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String storageCategory,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Warehouse.WarehouseStatus status,
            HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        Page<Warehouse> warehouses = warehouseService.getWarehouses(page, size, storageCategory, name, status);
        return Result.success(warehouses);
    }

    @GetMapping("/list")
    public Result<List<Warehouse>> getAllWarehouses(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        List<Warehouse> warehouses = warehouseService.getAllWarehouses();
        return Result.success(warehouses);
    }

    @PostMapping("/area")
    public Result<WarehouseArea> createWarehouseArea(@Valid @RequestBody WarehouseArea area, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        if (!Role.ADMIN.equals(currentUser.getRole()) && !Role.WAREHOUSE_KEEPER.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            WarehouseArea created = warehouseService.createWarehouseArea(area);
            return Result.success("创建成功", created);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/area/{id}")
    public Result<WarehouseArea> updateWarehouseArea(@PathVariable Long id, @Valid @RequestBody WarehouseArea area, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        if (!Role.ADMIN.equals(currentUser.getRole()) && !Role.WAREHOUSE_KEEPER.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        try {
            WarehouseArea updated = warehouseService.updateWarehouseArea(id, area);
            return Result.success("更新成功", updated);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/area/{id}")
    public Result<Void> deleteWarehouseArea(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        if (!Role.ADMIN.equals(currentUser.getRole())) {
            return Result.error(403, "无权限操作");
        }
        warehouseService.deleteWarehouseArea(id);
        return Result.success();
    }

    @GetMapping("/area/{id}")
    public Result<WarehouseArea> getWarehouseAreaById(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        WarehouseArea area = warehouseService.getWarehouseAreaById(id);
        if (area != null) {
            return Result.success(area);
        }
        return Result.error("库区不存在");
    }

    @GetMapping("/area/page")
    public Result<Page<WarehouseArea>> getWarehouseAreas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String areaCategory,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long warehouseId,
            HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        Page<WarehouseArea> areas = warehouseService.getWarehouseAreas(page, size, areaCategory, name, warehouseId);
        return Result.success(areas);
    }

    @GetMapping("/area/list/{warehouseId}")
    public Result<List<WarehouseArea>> getWarehouseAreasByWarehouseId(@PathVariable Long warehouseId, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error(401, "未登录");
        }
        List<WarehouseArea> areas = warehouseService.getWarehouseAreasByWarehouseId(warehouseId);
        return Result.success(areas);
    }
}
