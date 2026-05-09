package com.restaurant.queue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class QueueRequest {

    private Long restaurantId;

    @NotBlank(message = "手机号不能为空")
    private String phoneNumber;

    @NotNull(message = "用餐人数不能为空")
    @Positive(message = "用餐人数必须大于0")
    private Integer partySize;
}
