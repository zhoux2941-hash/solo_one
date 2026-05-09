package com.collabdocs.emotionaldocs.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParagraphSentiment {
    private int paragraphIndex;
    private String text;
    private double sentimentScore;
    private String emotion;
    private double intensity;
}
