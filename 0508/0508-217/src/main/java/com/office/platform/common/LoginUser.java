package com.office.platform.common;

import com.office.platform.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.servlet.http.HttpSession;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginUser {

    private Long id;
    private String username;
    private String realName;
    private Role role;
    private Long departmentId;
    private String departmentName;

    public static final String SESSION_KEY = "loginUser";

    public static LoginUser getFromSession(HttpSession session) {
        return (LoginUser) session.getAttribute(SESSION_KEY);
    }

    public static void setToSession(HttpSession session, LoginUser loginUser) {
        session.setAttribute(SESSION_KEY, loginUser);
    }

    public static void removeFromSession(HttpSession session) {
        session.removeAttribute(SESSION_KEY);
    }

    public boolean isAdmin() {
        return Role.ADMIN.equals(role);
    }
}