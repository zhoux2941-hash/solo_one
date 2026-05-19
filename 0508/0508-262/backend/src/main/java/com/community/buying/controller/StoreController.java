package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.entity.Store;
import com.community.buying.service.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    @Autowired
    private StoreService storeService;

    @GetMapping("/public/list")
    public Result<List<Store>> getPublicStores() {
        return Result.success(storeService.findByStatus(1));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('store:read')")
    public Result<List<Store>> getAllStores() {
        return Result.success(storeService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Store> getStoreDetail(@PathVariable Long id) {
        Store store = storeService.findById(id);
        if (store != null) {
            return Result.success(store);
        }
        return Result.error("门店不存在");
    }

    @GetMapping("/leader/{leaderId}")
    @PreAuthorize("hasAuthority('store:read')")
    public Result<Store> getStoreByLeader(@PathVariable Long leaderId) {
        Optional<Store> store = storeService.findByLeaderId(leaderId);
        return store.map(Result::success).orElseGet(() -> Result.error("门店不存在"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('store:write')")
    public Result<Store> createStore(@RequestBody Store store) {
        return Result.success("创建成功", storeService.save(store));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('store:write')")
    public Result<Store> updateStore(@PathVariable Long id, @RequestBody Store store) {
        store.setId(id);
        return Result.success("更新成功", storeService.save(store));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('store:write')")
    public Result<Store> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        Store store = storeService.updateStatus(id, status);
        if (store != null) {
            return Result.success("状态更新成功", store);
        }
        return Result.error("门店不存在");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('store:write')")
    public Result<Void> deleteStore(@PathVariable Long id) {
        storeService.deleteById(id);
        return Result.success("删除成功");
    }
}