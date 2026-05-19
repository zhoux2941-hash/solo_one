package com.music.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "musics")
public class Music {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String artist;

    @Column(length = 200)
    private String album;

    @Column(length = 1000)
    private String cover;

    @Column(nullable = false)
    private String filePath;

    @Column
    private Integer duration;

    @Column(length = 1000)
    private String tags;

    @Column(length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private Integer playCount = 0;

    @Column(nullable = false)
    private Integer likeCount = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
