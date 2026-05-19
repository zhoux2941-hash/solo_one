package com.industrial.workorder.exception;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLockingFailure(OptimisticLockingFailureException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "该工单已被其他用户处理，请刷新页面后重试");
        response.put("errorCode", "CONCURRENT_CONFLICT");
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ConcurrentOperationException.class)
    public ResponseEntity<Map<String, Object>> handleConcurrentOperation(ConcurrentOperationException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", e.getMessage());
        response.put("errorCode", "CONCURRENT_CONFLICT");
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception e) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "操作失败：" + e.getMessage());
        response.put("errorCode", "INTERNAL_ERROR");
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
