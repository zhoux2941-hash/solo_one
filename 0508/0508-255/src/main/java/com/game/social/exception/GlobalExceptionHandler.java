package com.game.social.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        Map<String, Object> response = new HashMap<>();
        String message = e.getMessage();
        
        if (message != null && message.contains("USERNAME")) {
            response.put("success", false);
            response.put("message", "用户名已存在，请使用其他用户名");
        } else if (message != null && message.contains("PLAYERS")) {
            response.put("success", false);
            response.put("message", "数据完整性错误，请检查输入");
        } else {
            response.put("success", false);
            response.put("message", "操作失败：" + e.getMessage());
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
