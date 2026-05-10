package com.quiz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audience_vote")
public class AudienceVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "audience_session", nullable = false, length = 100)
    private String audienceSession;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type")
    private VoteType voteType;

    @Column(name = "points")
    private Integer points;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (voteType == null) {
            voteType = VoteType.LIKE;
        }
        if (points == null) {
            points = voteType.getPoints();
        }
    }

    public enum VoteType {
        LIKE(1, "点赞"),
        CHEER(5, "打call"),
        FIRE(10, "火箭");

        private final int points;
        private final String description;

        VoteType(int points, String description) {
            this.points = points;
            this.description = description;
        }

        public int getPoints() {
            return points;
        }

        public String getDescription() {
            return description;
        }
    }
}
