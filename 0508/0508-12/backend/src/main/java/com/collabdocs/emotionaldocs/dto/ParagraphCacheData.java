package com.collabdocs.emotionaldocs.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParagraphCacheData implements Serializable {
    private int paragraphIndex;
    private String textHash;
    private double sentimentScore;
    private String emotion;
    private double positiveScore;
    private double negativeScore;
    private double neutralScore;
    private int wordCount;
    private long timestamp;
}
