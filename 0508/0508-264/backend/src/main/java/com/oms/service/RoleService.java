package com.oms.service;

import com.oms.entity.Permission;
import com.oms.entity.Role;
import com.oms.repository.PermissionRepository;
import com.oms.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 角色管理服务
 * 集成权限缓存管理和事件通知
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionEventService permissionEventService;

    /**
     * 更新角色权限
     * 关键方法：权限变更时自动清除缓存并广播事件
     */
    @Transactional
    public Role updateRolePermissions(Long roleId, List<Long> permissionIds, Long tenantId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在"));

        // 校验租户权限
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("无权限修改此角色");
        }

        // 更新权限
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
        role.setPermissions(permissions);

        Role savedRole = roleRepository.save(role);

        // 触发权限变更事件 - 清除缓存并广播
        permissionEventService.onRolePermissionChanged(roleId, tenantId);

        log.info("角色权限更新成功, roleId: {}, 权限数量: {}", roleId, permissions.size());
        return savedRole;
    }

    /**
     * 创建新角色
     */
    @Transactional
    public Role createRole(Role role, Long tenantId) {
        role.setTenantId(tenantId);
        Role savedRole = roleRepository.save(role);

        // 触发租户权限变更事件
        permissionEventService.onTenantPermissionChanged(tenantId);

        return savedRole;
    }

    /**
     * 删除角色
     */
    @Transactional
    public void deleteRole(Long roleId, Long tenantId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在"));

        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("无权限删除此角色");
        }

        roleRepository.delete(role);

        // 触发权限变更事件
        permissionEventService.onRolePermissionChanged(roleId, tenantId);
    }

    /**
     * 获取角色详情（包含权限列表）
     */
    public Role getRoleWithPermissions(Long roleId, Long tenantId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("角色不存在"));

        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("无权限查看此角色");
        }

        // 初始化权限集合（防止懒加载）
        role.getPermissions().size();
        return role;
    }

    /**
     * 获取租户下所有角色
     */
    public List<Role> getRolesByTenant(Long tenantId) {
        return roleRepository.findByTenantId(tenantId);
    }

    /**
     * 刷新角色权限缓存
     */
    public void refreshRoleCache(Long roleId, Long tenantId) {
        permissionEventService.onRolePermissionChanged(roleId, tenantId);
    }
}
