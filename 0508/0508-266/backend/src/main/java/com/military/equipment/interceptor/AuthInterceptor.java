package com.military.equipment.interceptor;

import cn.hutool.core.util.StrUtil;
import com.military.equipment.annotation.RequiresRoles;
import com.military.equipment.exception.BusinessException;
import com.military.equipment.util.JwtUtil;
import com.military.equipment.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Slf4j
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    public AuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        System.out.println("========== AuthInterceptor被调用! 请求路径: " + request.getRequestURI() + ", handler类型: " + (handler != null ? handler.getClass().getName() : "null"));
        
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        String token = request.getHeader("Authorization");
        if (StrUtil.isBlank(token)) {
            throw new BusinessException(401, "未授权，请先登录");
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        if (!jwtUtil.validateToken(token)) {
            throw new BusinessException(401, "Token无效或已过期");
        }

        Long userId = jwtUtil.getUserIdFromToken(token);
        String username = jwtUtil.getUsernameFromToken(token);
        String roleCode = jwtUtil.getRoleCodeFromToken(token);

        UserContext.setUserId(userId);
        UserContext.setUsername(username);
        UserContext.setRoleCode(roleCode);

        log.info("拦截器: handler类型 = {}, 请求路径 = {}", handler != null ? handler.getClass().getName() : "null", request.getRequestURI());
        
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            RequiresRoles methodAnnotation = handlerMethod.getMethodAnnotation(RequiresRoles.class);
            RequiresRoles classAnnotation = handlerMethod.getBeanType().getAnnotation(RequiresRoles.class);

            log.info("拦截器: 方法注解 = {}, 类注解 = {}", methodAnnotation != null, classAnnotation != null);

            RequiresRoles requiresRoles = methodAnnotation != null ? methodAnnotation : classAnnotation;

            if (requiresRoles != null) {
                String[] requiredRoles = requiresRoles.value();
                RequiresRoles.Logical logical = requiresRoles.logical();
                
                log.info("权限校验: 当前角色[{}], 需要角色[{}]", roleCode, String.join(",", requiredRoles));

                boolean hasPermission = false;

                if (logical == RequiresRoles.Logical.OR) {
                    for (String role : requiredRoles) {
                        if (roleCode.equals(role)) {
                            hasPermission = true;
                            break;
                        }
                    }
                } else {
                    hasPermission = true;
                    for (String role : requiredRoles) {
                        if (!roleCode.equals(role)) {
                            hasPermission = false;
                            break;
                        }
                    }
                }

                if (!hasPermission) {
                    log.warn("用户角色[{}]无权限访问该接口，需要角色：{}", roleCode, String.join(",", requiredRoles));
                    throw new BusinessException(403, "权限不足，无法访问该接口");
                }
            }
        } else {
            log.warn("拦截器: handler不是HandlerMethod类型，而是: {}", handler != null ? handler.getClass().getName() : "null");
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
