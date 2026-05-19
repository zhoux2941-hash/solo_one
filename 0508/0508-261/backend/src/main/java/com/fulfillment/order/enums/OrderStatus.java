package com.fulfillment.order.enums;

import lombok.Getter;

@Getter
public enum OrderStatus {
    CREATED("CREATED", "待支付"),
    PAID("PAID", "已支付"),
    SHIPPED("SHIPPED", "已发货"),
    DELIVERED("DELIVERED", "已签收"),
    CANCELLED("CANCELLED", "已取消");

    private final String code;
    private final String desc;

    OrderStatus(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static OrderStatus fromCode(String code) {
        for (OrderStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return null;
    }
}