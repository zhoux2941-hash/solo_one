package com.healthcare.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.common.Result;
import com.healthcare.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class LoginInterceptor implements HandlerInterceptor {
    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }
        String token = request.getHeader("Authorization");
        if (token == null || !authService.validateToken(token)) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Result<?> result = Result.error(401, "未登录或登录已过期");
            response.getWriter().write(objectMapper.writeValueAsString(result));
            return false;
        }
        return true;
    }
}