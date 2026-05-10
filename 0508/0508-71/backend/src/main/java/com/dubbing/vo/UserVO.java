package com.dubbing.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UserVO {
    private Long id;
    private String username;
    private String nickname;
    private Integer role;
    private BigDecimal balance;
    private String avatar;
    private String description;
    private LocalDateTime createTime;
    private String token;
}
