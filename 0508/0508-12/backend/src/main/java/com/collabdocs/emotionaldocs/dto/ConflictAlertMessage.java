package com.collabdocs.emotionaldocs.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictAlertMessage implements Serializable {
    private String alertId;
    private Long docId;
    private int paragraphIndex;
    private Long currentUserId;
    private String currentUserName;
    private Double currentUserScore;
    private String currentUserEmotion;
    private Long otherUserId;
    private String otherUserName;
    private Double otherUserScore;
    private String otherUserEmotion;
    private Double scoreDifference;
    private String message;
    private LocalDateTime timestamp;
}
