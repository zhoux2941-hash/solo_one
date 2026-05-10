package com.example.trashbin.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

@Data
public class ResidentRegisterDTO {
    @NotBlank(message = "房号不能为空")
    private String roomNumber;
    
    @NotBlank(message = "姓名不能为空")
    private String name;
}
