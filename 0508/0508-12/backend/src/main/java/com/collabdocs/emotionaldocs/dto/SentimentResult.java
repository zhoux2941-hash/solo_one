package com.collabdocs.emotionaldocs.dto;

import com.collabdocs.emotionaldocs.entity.SentimentSnapshot.Emotion;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SentimentResult {
    private double sentimentScore;
    private Emotion dominantEmotion;
    private double positiveScore;
    private double negativeScore;
    private double neutralScore;
}
