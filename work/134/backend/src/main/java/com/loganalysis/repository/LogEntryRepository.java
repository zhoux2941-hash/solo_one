package com.loganalysis.repository;

import com.loganalysis.entity.LogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 日志条目 Elasticsearch 数据访问层
 */
@Repository
public interface LogEntryRepository extends ElasticsearchRepository<LogEntry, String> {

    /**
     * 按时间范围查询日志
     */
    Page<LogEntry> findByTimestampBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 按日志级别查询
     */
    Page<LogEntry> findByLevel(String level, Pageable pageable);

    /**
     * 按日志类型查询
     */
    Page<LogEntry> findByLogType(String logType, Pageable pageable);

    /**
     * 按时间范围和日志级别查询
     */
    Page<LogEntry> findByTimestampBetweenAndLevel(LocalDateTime startTime, LocalDateTime endTime, String level, Pageable pageable);

    /**
     * 按时间范围和日志类型查询
     */
    Page<LogEntry> findByTimestampBetweenAndLogType(LocalDateTime startTime, LocalDateTime endTime, String logType, Pageable pageable);

    /**
     * 按时间范围、日志级别和日志类型查询
     */
    Page<LogEntry> findByTimestampBetweenAndLevelAndLogType(LocalDateTime startTime, LocalDateTime endTime, String level, String logType, Pageable pageable);

    /**
     * 按来源查询
     */
    List<LogEntry> findBySource(String source);
}
