package com.military.equipment.util;

public class UserContext {
    private static final ThreadLocal<Long> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> usernameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> roleCodeHolder = new ThreadLocal<>();

    public static void setUserId(Long userId) {
        userIdHolder.set(userId);
    }

    public static Long getUserId() {
        return userIdHolder.get();
    }

    public static void setUsername(String username) {
        usernameHolder.set(username);
    }

    public static String getUsername() {
        return usernameHolder.get();
    }

    public static void setRoleCode(String roleCode) {
        roleCodeHolder.set(roleCode);
    }

    public static String getRoleCode() {
        return roleCodeHolder.get();
    }

    public static void clear() {
        userIdHolder.remove();
        usernameHolder.remove();
        roleCodeHolder.remove();
    }
}
