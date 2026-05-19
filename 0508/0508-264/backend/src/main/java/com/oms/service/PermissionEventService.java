package com.oms.service;

import com.oms.config.PermissionCacheManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 权限变更事件服务
 * 负责权限变更时的事件广播和缓存清理
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionEventService {

    private final PermissionCacheManager permissionCacheManager;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 角色权限变更事件
     * 当管理员修改角色权限时调用
     */
    public void onRolePermissionChanged(Long roleId, Long tenantId) {
        log.info("角色权限变更, roleId: {}, tenantId: {}", roleId, tenantId);

        // 1. 清除角色及相关用户的权限缓存
        permissionCacheManager.evictRolePermission(roleId);

        // 2. 通过WebSocket广播权限变更事件
        broadcastPermissionChange(tenantId, "ROLE_PERMISSION_CHANGED", "角色权限已更新");
    }

    /**
     * 用户角色变更事件
     * 当管理员修改用户角色时调用
     */
    public void onUserRoleChanged(Long userId, Long tenantId) {
        log.info("用户角色变更, userId: {}, tenantId: {}", userId, tenantId);

        // 1. 清除用户权限缓存
        permissionCacheManager.evictUserPermission(userId);

        // 2. 通知特定用户
        notifyUserPermissionChange(userId, "USER_ROLE_CHANGED", "您的角色权限已更新");
    }

    /**
     * 租户级权限变更事件
     * 当进行批量权限调整时调用
     */
    public void onTenantPermissionChanged(Long tenantId) {
        log.info("租户权限变更, tenantId: {}", tenantId);

        // 1. 清除租户下所有权限缓存
        permissionCacheManager.evictTenantPermissions(tenantId);

        // 2. 广播给整个租户
        broadcastPermissionChange(tenantId, "TENANT_PERMISSION_CHANGED", "系统权限配置已更新");
    }

    /**
     * 广播权限变更事件给整个租户
     */
    private void broadcastPermissionChange(Long tenantId, String eventType, String message) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("tenantId", tenantId);
        event.put("message", message);
        event.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        event.put("permissionVersion", permissionCacheManager.getPermissionVersion());
        event.put("needRefresh", true);

        // 发送到WebSocket主题
        String destination = "/topic/permission/" + tenantId;
        messagingTemplate.convertAndSend(destination, event);

        log.info("广播权限变更事件, destination: {}, event: {}", destination, eventType);
    }

    /**
     * 通知特定用户权限变更
     */
    private void notifyUserPermissionChange(Long userId, String eventType, String message) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("userId", userId);
        event.put("message", message);
        event.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        event.put("permissionVersion", permissionCacheManager.getPermissionVersion());
        event.put("needRefresh", true);

        // 发送到特定用户的队列
        String destination = "/queue/permission/user/" + userId;
        messagingTemplate.convertAndSend(destination, event);

        log.info("通知用户权限变更, destination: {}, userId: {}", destination, userId);
    }

    /**
     * 全局权限变更（慎用）
     */
    public void onGlobalPermissionChanged() {
        log.warn("全局权限变更事件触发");
        permissionCacheManager.evictAllPermissions();

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "GLOBAL_PERMISSION_CHANGED");
        event.put("message", "系统权限已全局更新");
        event.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        event.put("permissionVersion", permissionCacheManager.getPermissionVersion());
        event.put("needRefresh", true);

        messagingTemplate.convertAndSend("/topic/permission/global", event);
    }

    /**
     * 获取当前权限版本号
     */
    public long getCurrentPermissionVersion() {
        return permissionCacheManager.getPermissionVersion();
    }
}
