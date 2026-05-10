package com.pest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "knowledge")
public class Knowledge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "crop_type", nullable = false, length = 50)
    private String cropType;

    @Column(name = "pest_name", length = 100)
    private String pestName;

    @Column(name = "expert_id", nullable = false)
    private Long expertId;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime = LocalDateTime.now();

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;
}