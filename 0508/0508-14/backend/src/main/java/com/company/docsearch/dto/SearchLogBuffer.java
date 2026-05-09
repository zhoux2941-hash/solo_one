package com.company.docsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchLogBuffer implements Serializable {

    private static final long serialVersionUID = 1L;

    private String keyword;
    private String userId;
    private String clickedDocId;
    private LocalDateTime timestamp;
    private Integer resultCount;
    private Long generatedId;

    public static SearchLogBuffer fromRequest(String keyword, String userId, int resultCount) {
        return SearchLogBuffer.builder()
                .keyword(keyword)
                .userId(userId)
                .resultCount(resultCount)
                .timestamp(LocalDateTime.now())
                .generatedId(System.currentTimeMillis() + Thread.currentThread().getId())
                .build();
    }
}
