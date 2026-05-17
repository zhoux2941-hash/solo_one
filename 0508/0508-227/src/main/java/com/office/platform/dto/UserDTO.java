package com.office.platform.dto;

import com.office.platform.entity.Role;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class UserDTO {

    private Long id;

    @NotBlank(message = "用户名不能为空")
    private String username;

    private String password;

    @NotBlank(message = "真实姓名不能为空")
    private String realName;

    private String phone;

    private String email;

    private Role role = Role.EMPLOYEE;

    private Long departmentId;

    @NotNull(message = "状态不能为空")
    private Boolean enabled;
}