package com.oms.security;

import com.oms.config.PermissionCacheManager;
import com.oms.config.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.stream.Collectors;

/**
 * JWT认证过滤器
 * 关键修复：每次请求都从缓存/数据库实时获取最新权限，不依赖Token中的权限快照
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final PermissionCacheManager permissionCacheManager;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                String username = jwtTokenProvider.getUsernameFromToken(jwt);
                Long tenantId = jwtTokenProvider.getTenantIdFromToken(jwt);
                Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

                TenantContext.setTenantId(tenantId);
                TenantContext.setUserId(userId);

                // 关键修复：实时从缓存获取最新权限，不依赖Token中的旧权限
                Collection<? extends GrantedAuthority> authorities = getCurrentAuthorities(userId);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                authorities
                        );

                // 将用户ID和租户ID存入认证详情，便于后续使用
                authentication.setDetails(new UserAuthDetails(userId, tenantId));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // 在响应头中添加权限版本号，前端可检测是否需要刷新
                response.setHeader("X-Permission-Version",
                        String.valueOf(permissionCacheManager.getPermissionVersion()));
            }
        } catch (Exception ex) {
            log.error("设置用户认证信息失败", ex);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * 从缓存实时获取用户最新的权限列表
     * 这是解决权限缓存不一致的核心方法
     */
    private Collection<? extends GrantedAuthority> getCurrentAuthorities(Long userId) {
        // 实时从缓存获取权限码（缓存过期自动从数据库刷新）
        return permissionCacheManager.getUserPermissionCodes(userId).stream()
                .map(code -> new SimpleGrantedAuthority(code))
                .collect(Collectors.toSet());
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 用户认证详情，包含用户ID和租户ID
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class UserAuthDetails {
        private Long userId;
        private Long tenantId;
    }
}
