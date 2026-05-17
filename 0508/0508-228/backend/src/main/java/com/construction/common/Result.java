package com.construction.common;

public class Result<T> {

    private Integer code;
    private String message;
    private Boolean success;
    private T data;

    public Result() {
    }

    public Result(Integer code, String message, Boolean success, T data) {
        this.code = code;
        this.message = message;
        this.success = success;
        this.data = data;
    }

    public static <T> Result<T> success() {
        return new Result<>(200, "操作成功", true, null);
    }

    public static <T> Result<T> success(String message) {
        return new Result<>(200, message, true, null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "操作成功", true, data);
    }

    public static <T> Result<T> success(String message, T data) {
        return new Result<>(200, message, true, data);
    }

    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, false, null);
    }

    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, false, null);
    }

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
