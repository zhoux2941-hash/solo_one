package com.smartparking.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {
    
    SUCCESS(200, "操作成功"),
    FAIL(500, "操作失败"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    
    PARKING_SPACE_OCCUPIED(1001, "车位已被占用"),
    PARKING_SPACE_NOT_AVAILABLE(1002, "车位不可用"),
    VEHICLE_ALREADY_PARKING(1003, "车辆已在场"),
    VEHICLE_NOT_PARKING(1004, "车辆不在场"),
    ORDER_ALREADY_PAID(1005, "订单已支付"),
    DUPLICATE_PAYMENT(1006, "重复支付"),
    RATE_CONFIG_NOT_FOUND(1007, "费率配置不存在");

    private final Integer code;
    private final String message;
}
