package com.music.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "play_history")
public class PlayHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "music_id", nullable = false)
    private Music music;

    @Column(nullable = false)
    private LocalDateTime playedAt;

    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }
}
