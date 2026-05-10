package com.pet.hospital.dto;

import java.time.LocalDateTime;

public class ScrapRecordDTO {

    private Long id;
    private Long batchId;
    private String batchNumber;
    private String vaccineName;
    private Integer scrapQuantity;
    private String reason;
    private LocalDateTime scrappedAt;
    private String operator;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public String getVaccineName() {
        return vaccineName;
    }

    public void setVaccineName(String vaccineName) {
        this.vaccineName = vaccineName;
    }

    public Integer getScrapQuantity() {
        return scrapQuantity;
    }

    public void setScrapQuantity(Integer scrapQuantity) {
        this.scrapQuantity = scrapQuantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getScrappedAt() {
        return scrappedAt;
    }

    public void setScrappedAt(LocalDateTime scrappedAt) {
        this.scrappedAt = scrappedAt;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }
}
