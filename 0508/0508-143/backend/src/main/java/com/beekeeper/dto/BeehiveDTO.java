package com.beekeeper.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BeehiveDTO {
    private Long id;
    
    @NotBlank(message = "蜂箱编号不能为空")
    private String hiveNumber;
    
    private String location;
    private String description;
}
