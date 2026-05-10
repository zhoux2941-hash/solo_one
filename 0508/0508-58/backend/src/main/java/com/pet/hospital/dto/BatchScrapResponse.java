package com.pet.hospital.dto;

import java.util.List;

public class BatchScrapResponse {

    private boolean success;
    private String message;
    private Integer totalScrapped;
    private List<ScrapRecordDTO> records;

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

    public Integer getTotalScrapped() {
        return totalScrapped;
    }

    public void setTotalScrapped(Integer totalScrapped) {
        this.totalScrapped = totalScrapped;
    }

    public List<ScrapRecordDTO> getRecords() {
        return records;
    }

    public void setRecords(List<ScrapRecordDTO> records) {
        this.records = records;
    }
}
