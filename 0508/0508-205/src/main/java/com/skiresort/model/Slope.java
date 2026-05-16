package com.skiresort.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "slopes")
public class Slope {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficulty;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SlopeStatus status;

    private Double length;

    private Integer capacity;

    @Column(name = "map_x")
    private Double mapX;

    @Column(name = "map_y")
    private Double mapY;

    @Column(name = "map_width")
    private Double mapWidth;

    @Column(name = "map_height")
    private Double mapHeight;

    @Column(name = "visitor_count")
    private Integer visitorCount = 0;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public enum DifficultyLevel {
        BEGINNER("初级"),
        INTERMEDIATE("中级"),
        ADVANCED("高级");

        private final String displayName;

        DifficultyLevel(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum SlopeStatus {
        OPEN("开放"),
        CLOSED("关闭"),
        GROOMING("压雪中");

        private final String displayName;

        SlopeStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
