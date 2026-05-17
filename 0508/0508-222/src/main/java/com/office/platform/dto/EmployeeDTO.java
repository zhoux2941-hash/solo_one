package com.office.platform.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

@Data
public class EmployeeDTO {

    private Long id;

    private Long userId;

    @NotBlank(message = "姓名不能为空")
    private String name;

    @NotBlank(message = "身份证号不能为空")
    @Pattern(regexp = "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$", message = "身份证号格式不正确")
    private String idCard;

    private String phone;

    private String email;

    private String entryDate;

    private String education;

    private String emergencyContact;

    private String emergencyPhone;

    private Long departmentId;

    private Long positionId;

    private String attachment;

    @NotNull(message = "状态不能为空")
    private Boolean enabled;
}
