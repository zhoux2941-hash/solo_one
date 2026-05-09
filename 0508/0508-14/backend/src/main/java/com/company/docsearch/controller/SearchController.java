package com.company.docsearch.controller;

import com.company.docsearch.dto.ClickRequest;
import com.company.docsearch.dto.SearchRequest;
import com.company.docsearch.dto.SearchResult;
import com.company.docsearch.service.RecommendationService;
import com.company.docsearch.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final RecommendationService recommendationService;

    @PostMapping
    public ResponseEntity<SearchResult> search(@RequestBody SearchRequest request) {
        if (request.getKeyword() == null || request.getKeyword().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        SearchResult result = searchService.search(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/click")
    public ResponseEntity<Void> recordClick(@RequestBody ClickRequest request,
                                             @RequestParam(required = false) String keyword) {
        if (request.getSearchId() == null || request.getDocId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (keyword != null && !keyword.isEmpty()) {
            searchService.recordClickWithKeyword(request, keyword);
        } else {
            searchService.recordClick(request);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/hot")
    public ResponseEntity<List<Map<String, Object>>> getHotSearches(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> result = searchService.getHotSearches(limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSuggestions(
            @RequestParam(required = true) String prefix,
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> result = recommendationService.getComboSuggestions(prefix, limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/related")
    public ResponseEntity<List<Map<String, Object>>> getRelatedSearches(
            @RequestParam(required = true) String keyword,
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> result = recommendationService.getRelatedSearches(keyword, limit);
        return ResponseEntity.ok(result);
    }
}
