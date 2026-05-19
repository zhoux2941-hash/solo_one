package com.military.equipment.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.military.equipment.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class SysUser extends BaseEntity {
    private String username;
    private String password;
    private String realName;
    private String phone;
    private String email;
    private String deptName;
    private Integer status;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;

    @TableField(exist = false)
    private List<Long> roleIds;

    @TableField(exist = false)
    private List<String> roleCodes;
}
