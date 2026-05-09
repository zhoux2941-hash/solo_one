package com.company.docsearch.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_logs", indexes = {
    @Index(name = "idx_keyword", columnList = "keyword"),
    @Index(name = "idx_timestamp", columnList = "timestamp"),
    @Index(name = "idx_doc_id", columnList = "clicked_doc_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long searchId;

    @Column(nullable = false, length = 500)
    private String keyword;

    @Column(name = "user_id", length = 100)
    private String userId;

    @Column(name = "clicked_doc_id", length = 100)
    private String clickedDocId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "result_count")
    private Integer resultCount;
}
