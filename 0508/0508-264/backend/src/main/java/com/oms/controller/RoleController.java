package com.oms.controller;

import com.oms.config.TenantContext;
import com.oms.entity.Role;
import com.oms.service.RoleService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 角色管理控制器
 * 提供角色的CRUD操作，修改角色权限时自动触发缓存刷新和事件广播
 */
@Slf4j
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoleController {

    private final RoleService roleService;

    /**
     * 获取租户下所有角色
     */
    @GetMapping
    public ResponseEntity<List<Role>> getRoles() {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(roleService.getRolesByTenant(tenantId));
    }

    /**
     * 获取角色详情（包含权限列表）
     */
    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(roleService.getRoleWithPermissions(id, tenantId));
    }

    /**
     * 创建新角色
     */
    @PostMapping
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        Long tenantId = TenantContext.getTenantId();
        Role created = roleService.createRole(role, tenantId);
        log.info("创建新角色, roleId: {}, roleName: {}", created.getId(), created.getRoleName());
        return ResponseEntity.ok(created);
    }

    /**
     * 更新角色权限 - 关键接口
     * 修改权限后自动清除缓存并通过WebSocket通知所有相关用户
     */
    @PutMapping("/{id}/permissions")
    public ResponseEntity<Map<String, Object>> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody UpdateRolePermissionsRequest request) {

        Long tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();

        Role updated = roleService.updateRolePermissions(id, request.getPermissionIds(), tenantId);

        log.info("角色权限更新, operatorId: {}, roleId: {}, 权限数量: {}",
                userId, id, updated.getPermissions().size());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "角色权限已更新，相关用户权限将即时生效",
                "roleId", id,
                "permissionCount", updated.getPermissions().size()
        ));
    }

    /**
     * 删除角色
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();
        roleService.deleteRole(id, tenantId);

        log.info("删除角色, roleId: {}, tenantId: {}", id, tenantId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "角色已删除"
        ));
    }

    /**
     * 手动刷新角色权限缓存
     */
    @PostMapping("/{id}/refresh-cache")
    public ResponseEntity<Map<String, Object>> refreshRoleCache(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();
        roleService.refreshRoleCache(id, tenantId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "角色权限缓存已刷新"
        ));
    }

    /**
     * 更新角色权限请求体
     */
    @Data
    public static class UpdateRolePermissionsRequest {
        private List<Long> permissionIds;
    }
}
