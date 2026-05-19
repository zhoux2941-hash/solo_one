package com.music.dto;

import com.music.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {

    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String avatar;
    private String bio;
    private String role;
    private LocalDateTime createdAt;

    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setNickname(user.getNickname());
        dto.setAvatar(user.getAvatar());
        dto.setBio(user.getBio());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
