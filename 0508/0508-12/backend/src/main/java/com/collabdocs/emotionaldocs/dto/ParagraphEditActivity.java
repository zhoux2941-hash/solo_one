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
public class ParagraphEditActivity implements Serializable {
    private Long docId;
    private int paragraphIndex;
    private Long userId;
    private String username;
    private Double sentimentScore;
    private String emotion;
    private LocalDateTime timestamp;
    private String textHash;
}
