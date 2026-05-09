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
@Table(name = "action_logs")
public class ActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "action_id")
    private Long actionId;

    @Column(name = "doc_id", nullable = false)
    private Long docId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "action_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    @Column(name = "selected_text", columnDefinition = "TEXT")
    private String selectedText;

    @Column(name = "position_start")
    private Integer positionStart;

    @Column(name = "position_end")
    private Integer positionEnd;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    public enum ActionType {
        INSERT,
        DELETE,
        FORMAT,
        SAVE
    }
}
