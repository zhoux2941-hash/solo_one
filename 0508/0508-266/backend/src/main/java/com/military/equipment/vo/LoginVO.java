package com.military.equipment.vo;

import lombok.Data;

@Data
public class LoginVO {
    private String token;
    private Long userId;
    private String username;
    private String realName;
    private String roleCode;
    private String deptName;
}
