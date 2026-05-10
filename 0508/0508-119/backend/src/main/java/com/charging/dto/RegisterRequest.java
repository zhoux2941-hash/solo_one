package com.charging.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String realName;
    private String studentId;
    private String phone;
}
