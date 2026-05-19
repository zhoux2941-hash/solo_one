package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.entity.DeliveryRoute;
import com.community.buying.service.DeliveryRouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-routes")
public class DeliveryRouteController {

    @Autowired
    private DeliveryRouteService deliveryRouteService;

    @GetMapping
    @PreAuthorize("hasAuthority('order:read')")
    public Result<List<DeliveryRoute>> getAllRoutes() {
        return Result.success(deliveryRouteService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('order:read')")
    public Result<DeliveryRoute> getRouteDetail(@PathVariable Long id) {
        DeliveryRoute route = deliveryRouteService.findById(id);
        if (route != null) {
            return Result.success(route);
        }
        return Result.error("路线不存在");
    }

    @GetMapping("/delivery-person/{personId}")
    @PreAuthorize("hasAuthority('order:read')")
    public Result<List<DeliveryRoute>> getRoutesByDeliveryPerson(@PathVariable Long personId) {
        return Result.success(deliveryRouteService.findByDeliveryPersonId(personId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('order:write')")
    public Result<DeliveryRoute> createRoute(@RequestBody DeliveryRoute route) {
        return Result.success("创建成功", deliveryRouteService.save(route));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('order:write')")
    public Result<DeliveryRoute> updateRoute(@PathVariable Long id, @RequestBody DeliveryRoute route) {
        route.setId(id);
        return Result.success("更新成功", deliveryRouteService.save(route));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('order:write')")
    public Result<Void> deleteRoute(@PathVariable Long id) {
        deliveryRouteService.deleteById(id);
        return Result.success("删除成功");
    }
}