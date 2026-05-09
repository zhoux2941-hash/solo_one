package com.collabdocs.emotionaldocs.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordCloudData {
    private List<WordItem> positiveWords;
    private List<WordItem> negativeWords;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WordItem {
        private String text;
        private int weight;
    }
}
