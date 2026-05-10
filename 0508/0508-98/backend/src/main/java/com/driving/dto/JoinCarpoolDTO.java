package com.driving.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;

@Data
public class JoinCarpoolDTO {
    @NotNull(message = "拼车组ID不能为空")
    private Long carpoolGroupId;
}