package com.oms.controller;

import com.oms.config.PermissionCacheManager;
import com.oms.config.TenantContext;
import com.oms.entity.Permission;
import com.oms.repository.PermissionRepository;
import com.oms.service.PermissionEventService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 权限管理控制器
 * 提供权限刷新、权限校验等API端点
 */
@Slf4j
@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PermissionController {

    private final PermissionCacheManager permissionCacheManager;
    private final PermissionEventService permissionEventService;
    private final PermissionRepository permissionRepository;

    /**
     * 检查权限是否需要刷新
     * 前端定期调用此接口，比较服务端和客户端的权限版本号
     */
    @GetMapping("/check-version")
    public ResponseEntity<Map<String, Object>> checkPermissionVersion(
            @RequestHeader(value = "X-Client-Permission-Version", defaultValue = "0") Long clientVersion) {

        long serverVersion = permissionEventService.getCurrentPermissionVersion();
        boolean needRefresh = serverVersion > clientVersion;

        Map<String, Object> result = new HashMap<>();
        result.put("serverVersion", serverVersion);
        result.put("clientVersion", clientVersion);
        result.put("needRefresh", needRefresh);

        if (needRefresh) {
            log.info("检测到权限版本变更, clientVersion: {}, serverVersion: {}", clientVersion, serverVersion);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * 刷新当前用户的权限缓存
     * 前端接收到权限变更通知后调用此接口
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshPermissions() {
        Long userId = TenantContext.getUserId();
        Long tenantId = TenantContext.getTenantId();

        // 清除当前用户的权限缓存
        permissionCacheManager.evictUserPermission(userId);

        // 重新加载权限
        Set<String> permissions = permissionCacheManager.getUserPermissionCodes(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "权限缓存已刷新");
        result.put("permissionVersion", permissionEventService.getCurrentPermissionVersion());
        result.put("permissions", permissions);

        log.info("用户权限缓存已刷新, userId: {}, 权限数量: {}", userId, permissions.size());
        return ResponseEntity.ok(result);
    }

    /**
     * 获取当前用户的权限列表
     */
    @GetMapping("/my-permissions")
    public ResponseEntity<Set<String>> getMyPermissions() {
        Long userId = TenantContext.getUserId();
        Set<String> permissions = permissionCacheManager.getUserPermissionCodes(userId);
        return ResponseEntity.ok(permissions);
    }

    /**
     * 获取所有权限列表（树形结构）
     */
    @GetMapping("/all")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionRepository.findAll());
    }

    /**
     * 手动刷新租户下所有权限缓存（管理员功能）
     */
    @PostMapping("/admin/refresh-tenant")
    public ResponseEntity<Map<String, Object>> refreshTenantPermissions() {
        Long tenantId = TenantContext.getTenantId();

        permissionEventService.onTenantPermissionChanged(tenantId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "租户权限缓存已刷新");
        result.put("permissionVersion", permissionEventService.getCurrentPermissionVersion());

        log.info("管理员刷新租户权限缓存, tenantId: {}", tenantId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取缓存统计信息（管理员功能）
     */
    @GetMapping("/admin/cache-stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        return ResponseEntity.ok(permissionCacheManager.getCacheStats());
    }

    /**
     * 权限检查请求体
     */
    @Data
    public static class PermissionCheckRequest {
        private String permissionCode;
    }
}
