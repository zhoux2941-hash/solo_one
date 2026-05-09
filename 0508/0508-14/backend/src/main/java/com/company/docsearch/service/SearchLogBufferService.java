package com.company.docsearch.service;

import com.company.docsearch.dto.SearchLogBuffer;
import com.company.docsearch.entity.SearchLog;
import com.company.docsearch.repository.SearchLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchLogBufferService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SearchLogRepository searchLogRepository;

    @Value("${app.redis.log-buffer-key:search_log_buffer}")
    private String logBufferKey;

    @Value("${app.redis.pending-click-key:pending_clicks}")
    private String pendingClickKey;

    @Value("${app.redis.hot-search-buffer-key:hot_search_buffer}")
    private String hotSearchBufferKey;

    @Value("${app.batch-size:1000}")
    private int batchSize;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public Long bufferSearchLog(SearchLogBuffer buffer) {
        try {
            String json = objectMapper.writeValueAsString(buffer);
            redisTemplate.opsForList().rightPush(logBufferKey, json);
            return buffer.getGeneratedId();
        } catch (Exception e) {
            log.error("缓冲搜索日志失败", e);
            return null;
        }
    }

    public void bufferClick(String generatedId, String docId) {
        try {
            redisTemplate.opsForHash().put(pendingClickKey, generatedId, docId);
        } catch (Exception e) {
            log.error("缓冲点击记录失败", e);
        }
    }

    public void bufferHotSearch(String keyword) {
        try {
            redisTemplate.opsForZSet().incrementScore(hotSearchBufferKey, keyword, 1);
        } catch (Exception e) {
            log.error("缓冲热门搜索词失败", e);
        }
    }

    @Scheduled(fixedRate = 10000, initialDelay = 10000)
    @Transactional
    public void flushSearchLogs() {
        long startTime = System.currentTimeMillis();
        int totalFlushed = 0;

        try {
            Long size = redisTemplate.opsForList().size(logBufferKey);
            if (size == null || size == 0) {
                log.debug("搜索日志队列为空，跳过批量写入");
                return;
            }

            while (true) {
                List<Object> batch = redisTemplate.opsForList().leftPop(
                        logBufferKey, batchSize, TimeUnit.SECONDS);

                if (batch == null || batch.isEmpty()) {
                    break;
                }

                List<SearchLog> logs = new ArrayList<>();
                for (Object obj : batch) {
                    try {
                        SearchLogBuffer buffer = objectMapper.readValue(
                                (String) obj, SearchLogBuffer.class);

                        String clickedDocId = null;
                        if (buffer.getGeneratedId() != null) {
                            Object cachedClick = redisTemplate.opsForHash()
                                    .get(pendingClickKey, String.valueOf(buffer.getGeneratedId()));
                            if (cachedClick != null) {
                                clickedDocId = (String) cachedClick;
                                redisTemplate.opsForHash()
                                        .delete(pendingClickKey, String.valueOf(buffer.getGeneratedId()));
                            }
                        }

                        SearchLog searchLog = SearchLog.builder()
                                .keyword(buffer.getKeyword())
                                .userId(buffer.getUserId())
                                .clickedDocId(clickedDocId)
                                .timestamp(buffer.getTimestamp())
                                .resultCount(buffer.getResultCount())
                                .build();
                        logs.add(searchLog);
                    } catch (JsonProcessingException e) {
                        log.error("解析搜索日志失败", e);
                    }
                }

                if (!logs.isEmpty()) {
                    searchLogRepository.saveAll(logs);
                    totalFlushed += logs.size();
                    log.info("批量写入了 {} 条搜索日志", logs.size());
                }

                if (batch.size() < batchSize) {
                    break;
                }
            }

            if (totalFlushed > 0) {
                log.info("本次刷新完成，共写入 {} 条搜索日志，耗时 {}ms",
                        totalFlushed, System.currentTimeMillis() - startTime);
            }

        } catch (Exception e) {
            log.error("批量写入搜索日志失败", e);
        }
    }

    @Scheduled(fixedRate = 30000, initialDelay = 30000)
    public void mergeHotSearchBuffer() {
        try {
            Set<Object> keywords = redisTemplate.opsForZSet().reverseRange(hotSearchBufferKey, 0, -1);

            if (keywords == null || keywords.isEmpty()) {
                log.debug("热门搜索缓冲区为空，跳过合并");
                return;
            }

            for (Object keywordObj : keywords) {
                String keyword = (String) keywordObj;
                Double score = redisTemplate.opsForZSet().score(hotSearchBufferKey, keyword);
                if (score != null && score > 0) {
                    redisTemplate.opsForZSet().incrementScore("hot_searches", keyword, score);
                }
            }

            redisTemplate.delete(hotSearchBufferKey);
            log.info("热门搜索词缓冲区合并完成");

        } catch (Exception e) {
            log.error("合并热门搜索缓冲区失败", e);
        }
    }

    public long getPendingLogCount() {
        try {
            Long size = redisTemplate.opsForList().size(logBufferKey);
            return size != null ? size : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
