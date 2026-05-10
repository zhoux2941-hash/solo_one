package com.pet.hospital.dto;

import java.util.List;

public class UseVaccineResponse {

    private boolean success;
    private String message;
    private Long vaccineId;
    private String vaccineName;
    private Integer totalUsed;
    private Integer remainingQuantity;
    private List<UsedBatchDTO> usedBatches;

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getVaccineId() {
        return vaccineId;
    }

    public void setVaccineId(Long vaccineId) {
        this.vaccineId = vaccineId;
    }

    public String getVaccineName() {
        return vaccineName;
    }

    public void setVaccineName(String vaccineName) {
        this.vaccineName = vaccineName;
    }

    public Integer getTotalUsed() {
        return totalUsed;
    }

    public void setTotalUsed(Integer totalUsed) {
        this.totalUsed = totalUsed;
    }

    public Integer getRemainingQuantity() {
        return remainingQuantity;
    }

    public void setRemainingQuantity(Integer remainingQuantity) {
        this.remainingQuantity = remainingQuantity;
    }

    public List<UsedBatchDTO> getUsedBatches() {
        return usedBatches;
    }

    public void setUsedBatches(List<UsedBatchDTO> usedBatches) {
        this.usedBatches = usedBatches;
    }
}
