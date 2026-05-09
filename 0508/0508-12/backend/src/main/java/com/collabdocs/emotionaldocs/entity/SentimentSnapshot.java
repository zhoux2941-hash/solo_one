package com.collabdocs.emotionaldocs.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sentiment_snapshots")
public class SentimentSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doc_id", nullable = false)
    private Long docId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "sentiment_score", nullable = false)
    private Double sentimentScore;

    @Column(name = "dominant_emotion", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Emotion dominantEmotion;

    @Column(name = "positive_score")
    private Double positiveScore;

    @Column(name = "negative_score")
    private Double negativeScore;

    @Column(name = "neutral_score")
    private Double neutralScore;

    @Column(name = "version_id")
    private Long versionId;

    public enum Emotion {
        POSITIVE,
        NEGATIVE,
        NEUTRAL
    }
}
