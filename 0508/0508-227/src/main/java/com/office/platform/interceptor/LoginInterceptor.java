package com.office.platform.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.office.platform.common.LoginUser;
import com.office.platform.common.Result;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

@Component
public class LoginInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession();
        LoginUser loginUser = LoginUser.getFromSession(session);

        if (loginUser == null) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(objectMapper.writeValueAsString(Result.error(401, "未登录或登录已过期")));
            return false;
        }

        return true;
    }
}