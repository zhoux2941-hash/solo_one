package com.company.docsearch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResult {
    private Long searchId;
    private String keyword;
    private List<String> matchedKeywords;
    private Integer resultCount;
    private List<DocInfo> documents;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocInfo {
        private String docId;
        private String title;
        private String category;
        private Integer clickCount;
    }
}
