package com.crew.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "notices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate noticeDate;

    @Column(nullable = false)
    private String sceneName;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(columnDefinition = "TEXT")
    private String costumeRequirement;

    @Column(columnDefinition = "TEXT")
    private String propRequirement;

    @Column(nullable = false)
    private Boolean materialsReady = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "director_id", nullable = false)
    private User director;

    @ManyToMany
    @JoinTable(
        name = "notice_actors",
        joinColumns = @JoinColumn(name = "notice_id"),
        inverseJoinColumns = @JoinColumn(name = "actor_id")
    )
    private Set<User> actors = new HashSet<>();
}