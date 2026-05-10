package com.blindbox.exchange.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String username;
    private String email;
    private String nickname;
    private Long userId;
}
