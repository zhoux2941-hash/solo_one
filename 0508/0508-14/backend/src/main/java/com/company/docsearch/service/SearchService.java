package com.company.docsearch.service;

import com.company.docsearch.dto.ClickRequest;
import com.company.docsearch.dto.SearchLogBuffer;
import com.company.docsearch.dto.SearchRequest;
import com.company.docsearch.dto.SearchResult;
import com.company.docsearch.entity.Document;
import com.company.docsearch.repository.DocumentRepository;
import com.company.docsearch.repository.SearchLogRepository;
import com.hankcs.hanlp.HanLP;
import com.hankcs.hanlp.seg.common.Term;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final DocumentRepository documentRepository;
    private final SearchLogRepository searchLogRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final SearchLogBufferService bufferService;
    private final RecommendationService recommendationService;

    @Value("${app.redis.hot-search-key:hot_searches}")
    private String hotSearchKey;

    public SearchResult search(SearchRequest request) {
        String keyword = request.getKeyword();
        String userId = request.getUserId();

        List<String> tokens = segmentKeyword(keyword);
        Set<String> uniqueTokens = new HashSet<>(tokens);

        List<Document> matchedDocs = new ArrayList<>();
        Set<String> matchedDocIds = new HashSet<>();

        for (String token : uniqueTokens) {
            if (token.trim().length() > 0) {
                List<Document> docs = documentRepository.searchByKeyword(token);
                for (Document doc : docs) {
                    if (!matchedDocIds.contains(doc.getDocId())) {
                        matchedDocIds.add(doc.getDocId());
                        matchedDocs.add(doc);
                    }
                }
            }
        }

        matchedDocs.sort((a, b) -> {
            int scoreA = calculateMatchScore(a, uniqueTokens);
            int scoreB = calculateMatchScore(b, uniqueTokens);
            return Integer.compare(scoreB, scoreA);
        });

        int resultCount = matchedDocs.size();

        SearchLogBuffer logBuffer = SearchLogBuffer.fromRequest(keyword, userId, resultCount);
        Long generatedId = bufferService.bufferSearchLog(logBuffer);

        updateHotSearchAsync(keyword);

        recommendationService.trackSearch(userId, keyword, String.valueOf(generatedId));

        List<SearchResult.DocInfo> docInfos = matchedDocs.stream()
                .limit(50)
                .map(doc -> SearchResult.DocInfo.builder()
                        .docId(doc.getDocId())
                        .title(doc.getTitle())
                        .category(doc.getCategory())
                        .clickCount(doc.getClickCount())
                        .build())
                .collect(Collectors.toList());

        return SearchResult.builder()
                .searchId(generatedId)
                .keyword(keyword)
                .matchedKeywords(new ArrayList<>(uniqueTokens))
                .resultCount(resultCount)
                .documents(docInfos)
                .build();
    }

    private List<String> segmentKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<String> tokens = new ArrayList<>();

        try {
            List<Term> terms = HanLP.segment(keyword);
            for (Term term : terms) {
                String word = term.word.trim();
                if (word.length() > 0) {
                    tokens.add(word);
                }
            }
        } catch (Exception e) {
            log.warn("分词失败，使用简单分词", e);
            String[] simpleTokens = keyword.split("[\\s\\p{Punct}]+");
            for (String t : simpleTokens) {
                if (t.trim().length() > 0) {
                    tokens.add(t.trim());
                }
            }
        }

        tokens.add(keyword);

        return tokens;
    }

    private int calculateMatchScore(Document doc, Set<String> tokens) {
        int score = 0;
        String title = doc.getTitle().toLowerCase();
        String content = (doc.getContent() != null ? doc.getContent() : "").toLowerCase();

        for (String token : tokens) {
            String lowerToken = token.toLowerCase();
            if (title.contains(lowerToken)) {
                score += 10;
            }
            if (content.contains(lowerToken)) {
                score += 1;
            }
        }

        if (doc.getClickCount() != null) {
            score += doc.getClickCount() / 10;
        }

        return score;
    }

    @Async("taskExecutor")
    public void recordClick(ClickRequest request) {
        try {
            if (request.getSearchId() != null) {
                bufferService.bufferClick(String.valueOf(request.getSearchId()), request.getDocId());
            }
            documentRepository.incrementClickCount(request.getDocId());
        } catch (Exception e) {
            log.warn("记录点击失败", e);
        }
    }

    @Async("taskExecutor")
    public void recordClickWithKeyword(ClickRequest request, String keyword) {
        recordClick(request);
        if (keyword != null && !keyword.isEmpty()) {
            recommendationService.trackClick(keyword, request.getDocId());
        }
    }

    @Async("taskExecutor")
    public void updateHotSearchAsync(String keyword) {
        try {
            bufferService.bufferHotSearch(keyword);
        } catch (Exception e) {
            log.warn("异步更新热门搜索缓存失败", e);
        }
    }

    public List<Map<String, Object>> getHotSearches(int limit) {
        try {
            Set<String> keywords = stringRedisTemplate.opsForZSet().reverseRange(hotSearchKey, 0, limit - 1);
            if (keywords != null && !keywords.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (String keyword : keywords) {
                    Double score = stringRedisTemplate.opsForZSet().score(hotSearchKey, keyword);
                    Map<String, Object> item = new HashMap<>();
                    item.put("keyword", keyword);
                    item.put("count", score != null ? score.intValue() : 0);
                    result.add(item);
                }
                return result;
            }
        } catch (Exception e) {
            log.warn("从Redis获取热门搜索失败，尝试从数据库获取", e);
        }

        List<Object[]> dbResults = searchLogRepository.countByKeyword();
        return dbResults.stream()
                .limit(limit)
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("keyword", row[0]);
                    item.put("count", row[1]);
                    return item;
                })
                .collect(Collectors.toList());
    }
}
