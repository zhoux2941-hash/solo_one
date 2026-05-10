package com.pet.hospital.dto;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

public class BatchScrapRequest {

    @NotEmpty(message = "请选择要报废的批次")
    private List<Long> batchIds;

    @NotNull(message = "报废原因不能为空")
    @Size(min = 1, max = 500, message = "报废原因长度应在1-500个字符之间")
    private String reason;

    private String operator;

    public List<Long> getBatchIds() {
        return batchIds;
    }

    public void setBatchIds(List<Long> batchIds) {
        this.batchIds = batchIds;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }
}
