package com.pet.hospital.dto;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

public class UseVaccineRequest {

    @NotNull(message = "疫苗ID不能为空")
    private Long vaccineId;

    @NotNull(message = "使用数量不能为空")
    @Min(value = 1, message = "使用数量必须大于0")
    private Integer quantity;

    public Long getVaccineId() {
        return vaccineId;
    }

    public void setVaccineId(Long vaccineId) {
        this.vaccineId = vaccineId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
