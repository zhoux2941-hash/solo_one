package com.festival.volunteer.dto;

import com.festival.volunteer.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String name;
    private User.Role role;
    
    public LoginResponse(String token, Long id, String username, String name, User.Role role) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.name = name;
        this.role = role;
    }
}
