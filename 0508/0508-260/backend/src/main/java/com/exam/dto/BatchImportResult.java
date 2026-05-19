package com.exam.dto;

import lombok.Data;
import java.util.List;

@Data
public class BatchImportResult {
    private Integer totalCount;
    private Integer successCount;
    private Integer duplicateCount;
    private List<String> duplicateTitles;

    public BatchImportResult() {
    }

    public BatchImportResult(Integer totalCount, Integer successCount, Integer duplicateCount, List<String> duplicateTitles) {
        this.totalCount = totalCount;
        this.successCount = successCount;
        this.duplicateCount = duplicateCount;
        this.duplicateTitles = duplicateTitles;
    }
}
