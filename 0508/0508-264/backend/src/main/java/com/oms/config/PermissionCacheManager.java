package com.oms.config;

import com.oms.entity.Permission;
import com.oms.repository.PermissionRepository;
import com.oms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.stream.Collectors;

/**
 * 权限缓存管理器
 * 解决管理员修改权限后，用户权限不即时生效的问题
 *
 * 缓存策略：
 * 1. 采用两级缓存：本地缓存 + 数据库
 * 2. 缓存自动过期时间：5分钟
 * 3. 权限变更时主动清除相关缓存
 * 4. 支持WebSocket广播通知前端刷新权限
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PermissionCacheManager {

    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    // 用户权限缓存：Key=userId, Value=权限码集合
    private final Map<Long, CacheEntry<Set<String>>> userPermissionCache = new ConcurrentHashMap<>();

    // 角色权限缓存：Key=roleId, Value=权限码集合
    private final Map<Long, CacheEntry<Set<String>>> rolePermissionCache = new ConcurrentHashMap<>();

    // 权限版本号 - 用于检测权限是否变更
    private volatile long permissionVersion = 0;

    // 缓存过期时间：5分钟
    private static final long CACHE_EXPIRE_TIME = 5 * 60 * 1000;

    // 需要权限刷新的租户集合
    private final Set<Long> tenantsNeedRefresh = new CopyOnWriteArraySet<>();

    /**
     * 缓存条目
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class CacheEntry<T> {
        private T data;
        private long timestamp;

        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_EXPIRE_TIME;
        }
    }

    /**
     * 获取用户权限码集合
     */
    public Set<String> getUserPermissionCodes(Long userId) {
        // 先查缓存
        CacheEntry<Set<String>> entry = userPermissionCache.get(userId);
        if (entry != null && !entry.isExpired()) {
            return entry.getData();
        }

        // 缓存失效，从数据库查询
        Set<String> permissions = loadUserPermissionsFromDB(userId);

        // 写入缓存
        userPermissionCache.put(userId, new CacheEntry<>(permissions, System.currentTimeMillis()));

        return permissions;
    }

    /**
     * 获取角色权限码集合
     */
    public Set<String> getRolePermissionCodes(Long roleId) {
        CacheEntry<Set<String>> entry = rolePermissionCache.get(roleId);
        if (entry != null && !entry.isExpired()) {
            return entry.getData();
        }

        Set<String> permissions = loadRolePermissionsFromDB(roleId);
        rolePermissionCache.put(roleId, new CacheEntry<>(permissions, System.currentTimeMillis()));
        return permissions;
    }

    /**
     * 从数据库加载用户权限
     */
    private Set<String> loadUserPermissionsFromDB(Long userId) {
        log.debug("从数据库加载用户权限, userId: {}", userId);
        return userRepository.findById(userId)
                .map(user -> user.getRoles().stream()
                        .flatMap(role -> role.getPermissions().stream())
                        .map(Permission::getPermissionCode)
                        .collect(Collectors.toSet()))
                .orElse(Set.of());
    }

    /**
     * 从数据库加载角色权限
     */
    private Set<String> loadRolePermissionsFromDB(Long roleId) {
        log.debug("从数据库加载角色权限, roleId: {}", roleId);
        return permissionRepository.findByRoleId(roleId).stream()
                .map(Permission::getPermissionCode)
                .collect(Collectors.toSet());
    }

    /**
     * 清除指定用户的权限缓存
     */
    public void evictUserPermission(Long userId) {
        userPermissionCache.remove(userId);
        log.info("清除用户权限缓存, userId: {}", userId);
    }

    /**
     * 清除指定角色的权限缓存，并级联清除拥有该角色的所有用户缓存
     */
    public void evictRolePermission(Long roleId) {
        rolePermissionCache.remove(roleId);

        // 找到所有拥有该角色的用户，清除他们的权限缓存
        userRepository.findUserIdsByRoleId(roleId).forEach(userId -> {
            userPermissionCache.remove(userId);
            log.debug("级联清除用户权限缓存, userId: {}", userId);
        });

        permissionVersion++;
        log.info("清除角色权限缓存, roleId: {}, 当前权限版本号: {}", roleId, permissionVersion);
    }

    /**
     * 清除租户下所有用户的权限缓存
     */
    public void evictTenantPermissions(Long tenantId) {
        userRepository.findByTenantId(tenantId).forEach(user -> {
            userPermissionCache.remove(user.getId());
        });

        rolePermissionCache.keySet().removeIf(roleId -> {
            // 这里简单处理，实际可以根据tenantId判断
            return true;
        });

        permissionVersion++;
        tenantsNeedRefresh.add(tenantId);
        log.info("清除租户所有权限缓存, tenantId: {}, 当前权限版本号: {}", tenantId, permissionVersion);
    }

    /**
     * 清除所有权限缓存
     */
    public void evictAllPermissions() {
        userPermissionCache.clear();
        rolePermissionCache.clear();
        permissionVersion++;
        log.info("清除所有权限缓存, 当前权限版本号: {}", permissionVersion);
    }

    /**
     * 获取当前权限版本号
     */
    public long getPermissionVersion() {
        return permissionVersion;
    }

    /**
     * 检查租户是否需要刷新权限
     */
    public boolean isTenantNeedRefresh(Long tenantId) {
        return tenantsNeedRefresh.contains(tenantId);
    }

    /**
     * 标记租户权限已刷新
     */
    public void markTenantRefreshed(Long tenantId) {
        tenantsNeedRefresh.remove(tenantId);
    }

    /**
     * 清理过期缓存（定时任务调用）
     */
    public void cleanExpiredCache() {
        long now = System.currentTimeMillis();
        int userCacheSizeBefore = userPermissionCache.size();
        int roleCacheSizeBefore = rolePermissionCache.size();

        userPermissionCache.entrySet().removeIf(entry ->
                now - entry.getValue().getTimestamp() > CACHE_EXPIRE_TIME
        );

        rolePermissionCache.entrySet().removeIf(entry ->
                now - entry.getValue().getTimestamp() > CACHE_EXPIRE_TIME
        );

        log.debug("清理过期权限缓存, 用户缓存: {} -> {}, 角色缓存: {} -> {}",
                userCacheSizeBefore, userPermissionCache.size(),
                roleCacheSizeBefore, rolePermissionCache.size());
    }

    /**
     * 获取缓存统计信息
     */
    public Map<String, Object> getCacheStats() {
        return Map.of(
                "userCacheSize", userPermissionCache.size(),
                "roleCacheSize", rolePermissionCache.size(),
                "permissionVersion", permissionVersion,
                "tenantsNeedRefresh", tenantsNeedRefresh.size()
        );
    }
}
