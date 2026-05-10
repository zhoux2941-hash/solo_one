package com.charging.config;

import com.charging.common.ResponseResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.OK)
    public ResponseResult<Void> handleRuntimeException(RuntimeException e) {
        log.error("Runtime exception: ", e);
        return ResponseResult.error(e.getMessage());
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.OK)
    public ResponseResult<Void> handleException(Exception e) {
        log.error("Exception: ", e);
        return ResponseResult.error("系统错误: " + e.getMessage());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.OK)
    public ResponseResult<Void> handleValidationException(MethodArgumentNotValidException e) {
        log.error("Validation exception: ", e);
        return ResponseResult.error("参数验证失败");
    }
}
