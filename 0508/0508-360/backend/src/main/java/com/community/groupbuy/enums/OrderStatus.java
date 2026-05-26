package com.community.groupbuy.enums;

import lombok.Getter;

@Getter
public enum OrderStatus {
    PENDING_PAYMENT("PENDING_PAYMENT", "待支付", 1),
    PENDING_SORTING("PENDING_SORTING", "待分拣", 2),
    PENDING_RECEIVE("PENDING_RECEIVE", "待提货", 3),
    COMPLETED("COMPLETED", "已完成", 4),
    CANCELLED("CANCELLED", "已取消", 0);

    private final String code;
    private final String description;
    private final int order;

    OrderStatus(String code, String description, int order) {
        this.code = code;
        this.description = description;
        this.order = order;
    }

    public static OrderStatus fromCode(String code) {
        for (OrderStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown order status: " + code);
    }

    public boolean canTransitionTo(OrderStatus target) {
        switch (this) {
            case PENDING_PAYMENT:
                return target == PENDING_SORTING || target == CANCELLED;
            case PENDING_SORTING:
                return target == PENDING_RECEIVE || target == CANCELLED;
            case PENDING_RECEIVE:
                return target == COMPLETED;
            case COMPLETED:
            case CANCELLED:
                return false;
            default:
                return false;
        }
    }
}
