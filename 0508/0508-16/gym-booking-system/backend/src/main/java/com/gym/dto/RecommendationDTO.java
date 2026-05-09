package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDTO {
    private Long courseId;
    private String courseName;
    private Long coachId;
    private String coachName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer capacity;
    private Integer remaining;
    private String description;
    private Double score;
    private String reason;
    private Double similarityScore;
    private String similarUserReason;
}
