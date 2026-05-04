package com.loganalysis.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 解析规则实体类，存储在 MySQL 中
 */
@Entity
@Table(name = "parse_rules")
@Data
public class ParseRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 规则名称
     */
    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    /**
     * 日志类型 (nginx, apache, json_lines, custom)
     */
    @Column(name = "log_type", nullable = false, length = 50)
    private String logType;

    /**
     * 规则类型 (regex 或 grok)
     */
    @Column(name = "rule_type", nullable = false, length = 20)
    private String ruleType;

    /**
     * 解析规则表达式（正则表达式或 grok 模式）
     */
    @Column(name = "pattern", nullable = false, columnDefinition = "TEXT")
    private String pattern;

    /**
     * 字段映射 JSON 字符串，定义解析出的字段名称和类型
     * 例如: {"timestamp":"date","level":"string","message":"string"}
     */
    @Column(name = "field_mapping", columnDefinition = "TEXT")
    private String fieldMapping;

    /**
     * 示例日志，用于测试规则
     */
    @Column(name = "sample_log", columnDefinition = "TEXT")
    private String sampleLog;

    /**
     * 是否启用
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at")
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
