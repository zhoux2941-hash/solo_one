package com.carpool.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDTO {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;

        @NotBlank(message = "密码不能为空")
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "用户名不能为空")
        @Size(min = 4, max = 50, message = "用户名长度为4-50个字符")
        private String username;

        @NotBlank(message = "密码不能为空")
        @Size(min = 6, max = 100, message = "密码长度至少6个字符")
        private String password;

        @NotBlank(message = "真实姓名不能为空")
        private String realName;

        private String phone;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String username;
        private String realName;
        private Integer creditScore;

        public AuthResponse(String token, Long userId, String username, String realName, Integer creditScore) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.realName = realName;
            this.creditScore = creditScore;
        }
    }
}
