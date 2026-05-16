package com.health.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class ReservationRequest {

    @NotBlank(message = "姓名不能为空")
    private String userName;

    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "身份证号不能为空")
    private String idCard;

    @NotNull(message = "套餐ID不能为空")
    private Long packageId;

    @NotBlank(message = "预约日期不能为空")
    private String reservationDate;

    @NotBlank(message = "预约时段不能为空")
    private String timeSlot;
}
