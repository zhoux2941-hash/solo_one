package com.military.equipment.aspect;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.military.equipment.annotation.OperateLog;
import com.military.equipment.entity.OperationLog;
import com.military.equipment.mapper.OperationLogMapper;
import com.military.equipment.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

@Slf4j
@Aspect
@Component
public class OperationLogAspect {

    @Resource
    private OperationLogMapper operationLogMapper;

    @Around("@annotation(com.military.equipment.annotation.OperateLog)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        OperationLog logEntity = createLog(joinPoint);

        try {
            Object result = joinPoint.proceed();
            logEntity.setOperationStatus(1);
            logEntity.setResponseResult(JSONUtil.toJsonStr(result));
            return result;
        } catch (Exception e) {
            logEntity.setOperationStatus(0);
            logEntity.setErrorMsg(e.getMessage());
            throw e;
        } finally {
            long executeTime = System.currentTimeMillis() - startTime;
            logEntity.setExecuteTime(executeTime);
            logEntity.setCreatedTime(LocalDateTime.now());
            try {
                operationLogMapper.insert(logEntity);
            } catch (Exception ex) {
                log.error("保存操作日志失败", ex);
            }
        }
    }

    private OperationLog createLog(ProceedingJoinPoint joinPoint) {
        OperationLog logEntity = new OperationLog();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        java.lang.reflect.Method method = signature.getMethod();
        OperateLog annotation = method.getAnnotation(OperateLog.class);

        logEntity.setUserId(UserContext.getUserId());
        logEntity.setUsername(UserContext.getUsername());

        if (annotation != null) {
            logEntity.setOperationModule(annotation.module());
            logEntity.setOperationType(annotation.type());
            logEntity.setOperationDesc(annotation.desc());
        }

        HttpServletRequest request = getRequest();
        if (request != null) {
            logEntity.setRequestMethod(request.getMethod());
            logEntity.setRequestUrl(request.getRequestURI());
            logEntity.setIpAddress(getClientIp(request));
        }

        Object[] args = joinPoint.getArgs();
        try {
            String params = JSONUtil.toJsonStr(args);
            if (params.length() > 2000) {
                params = params.substring(0, 2000) + "...";
            }
            logEntity.setRequestParams(params);
        } catch (Exception e) {
            logEntity.setRequestParams("参数解析失败");
        }

        return logEntity;
    }

    private HttpServletRequest getRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
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
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
