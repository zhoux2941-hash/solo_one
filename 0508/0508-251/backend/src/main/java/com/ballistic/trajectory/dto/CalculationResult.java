package com.ballistic.trajectory.dto;

import java.util.HashMap;
import java.util.Map;

public class CalculationResult {

    private boolean success;
    private String message;
    private Map<String, Object> data;

    public CalculationResult() {
        this.data = new HashMap<>();
    }

    public static CalculationResult success() {
        CalculationResult result = new CalculationResult();
        result.setSuccess(true);
        result.setMessage("计算成功");
        return result;
    }

    public static CalculationResult error(String message) {
        CalculationResult result = new CalculationResult();
        result.setSuccess(false);
        result.setMessage(message);
        return result;
    }

    public CalculationResult put(String key, Object value) {
        this.data.put(key, value);
        return this;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }
}
