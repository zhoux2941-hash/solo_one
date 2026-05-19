package com.oms.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    
    private final int code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }
    
    public BusinessException(String message, int code) {
        super(message);
        this.code = code;
    }
    
    public static BusinessException tenantNotFound() {
        return new BusinessException("未找到租户信息，请重新登录", 401);
    }
    
    public static BusinessException accessDenied() {
        return new BusinessException("无权限访问此资源", 403);
    }
    
    public static BusinessException notFound(String resource) {
        return new BusinessException(resource + "不存在", 404);
    }
    
    public static BusinessException invalidOperation(String message) {
        return new BusinessException(message, 400);
    }
}
