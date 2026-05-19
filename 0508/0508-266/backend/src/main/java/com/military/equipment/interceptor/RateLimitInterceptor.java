package com.military.equipment.interceptor;

import cn.hutool.core.util.StrUtil;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.military.equipment.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Value("${rate-limit.enabled:true}")
    private Boolean enabled;

    @Value("${rate-limit.default-limit:100}")
    private Integer defaultLimit;

    @Value("${rate-limit.default-time-window:60000}")
    private Long defaultTimeWindow;

    private final Cache<String, AtomicInteger> requestCache = CacheBuilder.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        System.out.println("========== RateLimitInterceptor被调用! 请求路径: " + request.getRequestURI());
        
        if (!enabled) {
            return true;
        }

        String key = getRequestKey(request);
        AtomicInteger count = requestCache.getIfPresent(key);

        if (count == null) {
            count = new AtomicInteger(0);
            requestCache.put(key, count);
        }

        int currentCount = count.incrementAndGet();
        if (currentCount > defaultLimit) {
            log.warn("请求频率超限: {} - {}", key, currentCount);
            throw new BusinessException(429, "请求过于频繁，请稍后再试");
        }

        return true;
    }

    private String getRequestKey(HttpServletRequest request) {
        String ip = getClientIp(request);
        String uri = request.getRequestURI();
        return StrUtil.format("{}:{}", ip, uri);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
