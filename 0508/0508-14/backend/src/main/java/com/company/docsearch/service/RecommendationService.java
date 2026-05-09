package com.company.docsearch.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${app.redis.session-prefix:search_session:}")
    private String sessionPrefix;

    @Value("${app.redis.word-assoc-key:word_associations}")
    private String wordAssocKey;

    @Value("${app.redis.word-prefix-key:word_prefix_index}")
    private String wordPrefixKey;

    @Value("${app.session.timeout-minutes:30}")
    private int sessionTimeoutMinutes;

    private static final String WORD_PAIR_PREFIX = "word_pair:";

    @Async("taskExecutor")
    public void trackSearch(String userId, String keyword, String searchId) {
        try {
            String sessionKey = sessionPrefix + (userId != null ? userId : "anonymous");

            String lastSearch = stringRedisTemplate.opsForValue().get(sessionKey + ":last");

            if (lastSearch != null && !lastSearch.equals(keyword)) {
                updateAssociation(lastSearch, keyword);
                updateAssociation(keyword, lastSearch);
            }

            stringRedisTemplate.opsForValue().set(sessionKey + ":last", keyword, sessionTimeoutMinutes, TimeUnit.MINUTES);
            stringRedisTemplate.opsForList().rightPush(sessionKey + ":history", keyword);
            stringRedisTemplate.expire(sessionKey + ":history", sessionTimeoutMinutes, TimeUnit.MINUTES);

            addToPrefixIndex(keyword);

        } catch (Exception e) {
            log.warn("追踪搜索记录失败", e);
        }
    }

    @Async("taskExecutor")
    public void trackClick(String keyword, String docId) {
        try {
            String docKey = "doc_searches:" + docId;

            Set<String> previousSearches = stringRedisTemplate.opsForSet().members(docKey);

            if (previousSearches != null && !previousSearches.isEmpty()) {
                for (String prevKeyword : previousSearches) {
                    if (!prevKeyword.equals(keyword)) {
                        updateAssociation(prevKeyword, keyword);
                        updateAssociation(keyword, prevKeyword);
                    }
                }
            }

            stringRedisTemplate.opsForSet().add(docKey, keyword);
            stringRedisTemplate.expire(docKey, 7, TimeUnit.DAYS);

        } catch (Exception e) {
            log.warn("追踪点击记录失败", e);
        }
    }

    private void updateAssociation(String wordA, String wordB) {
        try {
            String pairKey = WORD_PAIR_PREFIX + wordA + ":" + wordB;
            stringRedisTemplate.opsForZSet().incrementScore(wordAssocKey, pairKey, 1);
        } catch (Exception e) {
            log.warn("更新词关联失败", e);
        }
    }

    private void addToPrefixIndex(String keyword) {
        try {
            for (int i = 1; i <= Math.min(keyword.length(), 10); i++) {
                String prefix = keyword.substring(0, i);
                stringRedisTemplate.opsForSet().add(wordPrefixKey + ":" + prefix, keyword);
                stringRedisTemplate.expire(wordPrefixKey + ":" + prefix, 24, TimeUnit.HOURS);
            }
        } catch (Exception e) {
            log.warn("添加前缀索引失败", e);
        }
    }

    public List<Map<String, Object>> getRelatedSearches(String keyword, int limit) {
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            List<Map.Entry<String, Double>> pairs = new ArrayList<>();

            Set<String> matchingPairs = stringRedisTemplate.opsForZSet().range(wordAssocKey, 0, -1);
            if (matchingPairs != null) {
                for (String pair : matchingPairs) {
                    if (pair.startsWith(WORD_PAIR_PREFIX + keyword + ":")) {
                        Double score = stringRedisTemplate.opsForZSet().score(wordAssocKey, pair);
                        if (score != null) {
                            pairs.add(new AbstractMap.SimpleEntry<>(pair, score));
                        }
                    }
                }
            }

            pairs.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

            for (Map.Entry<String, Double> entry : pairs.stream().limit(limit).collect(Collectors.toList())) {
                String relatedWord = entry.getKey().replace(WORD_PAIR_PREFIX + keyword + ":", "");
                Map<String, Object> item = new HashMap<>();
                item.put("keyword", relatedWord);
                item.put("score", entry.getValue());
                result.add(item);
            }

        } catch (Exception e) {
            log.warn("获取相关搜索失败", e);
        }

        return result;
    }

    public List<Map<String, Object>> getSuggestions(String prefix, int limit) {
        List<Map<String, Object>> result = new ArrayList<>();

        if (prefix == null || prefix.trim().isEmpty()) {
            return result;
        }

        try {
            Set<String> suggestions = stringRedisTemplate.opsForSet().members(wordPrefixKey + ":" + prefix);
            if (suggestions != null && !suggestions.isEmpty()) {
                List<String> sortedSuggestions = suggestions.stream()
                        .sorted(Comparator.comparingInt(String::length))
                        .limit(limit)
                        .collect(Collectors.toList());

                for (String word : sortedSuggestions) {
                    Double hotScore = stringRedisTemplate.opsForZSet().score("hot_searches", word);
                    Map<String, Object> item = new HashMap<>();
                    item.put("keyword", word);
                    item.put("type", "prefix");
                    item.put("hot", hotScore != null ? hotScore.intValue() : 0);
                    result.add(item);
                }
            }

            if (result.size() < limit) {
                Set<String> hotWords = stringRedisTemplate.opsForZSet().reverseRange("hot_searches", 0, limit - 1);
                if (hotWords != null) {
                    for (String hotWord : hotWords) {
                        if (result.size() >= limit) break;
                        boolean exists = result.stream().anyMatch(r -> r.get("keyword").equals(hotWord));
                        if (!exists) {
                            Double score = stringRedisTemplate.opsForZSet().score("hot_searches", hotWord);
                            Map<String, Object> item = new HashMap<>();
                            item.put("keyword", hotWord);
                            item.put("type", "hot");
                            item.put("hot", score != null ? score.intValue() : 0);
                            result.add(item);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.warn("获取搜索建议失败", e);
        }

        return result;
    }

    public Map<String, Object> getComboSuggestions(String prefix, int limit) {
        Map<String, Object> result = new HashMap<>();

        List<Map<String, Object>> suggestions = new ArrayList<>();

        if (prefix != null && !prefix.trim().isEmpty()) {
            List<Map<String, Object>> related = getRelatedSearches(prefix, Math.max(3, limit / 2));
            for (Map<String, Object> item : related) {
                item.put("type", "related");
                suggestions.add(item);
            }

            if (suggestions.size() < limit) {
                List<Map<String, Object>> prefixSuggestions = getSuggestions(prefix, limit - suggestions.size());
                for (Map<String, Object> item : prefixSuggestions) {
                    boolean exists = suggestions.stream().anyMatch(s -> s.get("keyword").equals(item.get("keyword")));
                    if (!exists) {
                        suggestions.add(item);
                    }
                }
            }
        }

        result.put("suggestions", suggestions.stream().limit(limit).collect(Collectors.toList()));
        return result;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldAssociations() {
        try {
            Set<String> allPairs = stringRedisTemplate.opsForZSet().range(wordAssocKey, 0, -1);
            if (allPairs != null && allPairs.size() > 10000) {
                int removeCount = allPairs.size() - 10000;
                stringRedisTemplate.opsForZSet().removeRange(wordAssocKey, 0, removeCount - 1);
                log.info("清理了 {} 条旧的词关联记录", removeCount);
            }
        } catch (Exception e) {
            log.warn("清理词关联失败", e);
        }
    }
}
