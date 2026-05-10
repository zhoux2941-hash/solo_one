package com.blindbox.exchange.service;

import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.repository.BlindBoxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrowseHistoryService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final BlindBoxRepository blindBoxRepository;
    private final ObjectMapper objectMapper;
    private static final String HISTORY_KEY_PREFIX = "browse:history:";
    private static final int MAX_HISTORY_SIZE = 10;
    private static final int HISTORY_EXPIRE_DAYS = 30;

    public void addToHistory(Long userId, Long boxId) {
        String key = HISTORY_KEY_PREFIX + userId;
        try {
            String historyJson = (String) redisTemplate.opsForValue().get(key);
            List<Long> history;
            if (historyJson != null) {
                history = objectMapper.readValue(historyJson, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
            } else {
                history = new ArrayList<>();
            }
            history.remove(boxId);
            history.add(0, boxId);
            if (history.size() > MAX_HISTORY_SIZE) {
                history = history.subList(0, MAX_HISTORY_SIZE);
            }
            String newHistoryJson = objectMapper.writeValueAsString(history);
            redisTemplate.opsForValue().set(key, newHistoryJson, HISTORY_EXPIRE_DAYS, TimeUnit.DAYS);
        } catch (JsonProcessingException e) {
            log.error("Failed to save browse history", e);
        }
    }

    public List<BlindBox> getBrowseHistory(Long userId) {
        String key = HISTORY_KEY_PREFIX + userId;
        try {
            String historyJson = (String) redisTemplate.opsForValue().get(key);
            if (historyJson != null) {
                List<Long> history = objectMapper.readValue(historyJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
                if (!history.isEmpty()) {
                    List<BlindBox> boxes = blindBoxRepository.findAllById(history);
                    Map<Long, BlindBox> boxMap = boxes.stream()
                            .collect(Collectors.toMap(BlindBox::getId, b -> b));
                    return history.stream()
                            .map(boxMap::get)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to get browse history", e);
        }
        return Collections.emptyList();
    }

    public void clearHistory(Long userId) {
        String key = HISTORY_KEY_PREFIX + userId;
        redisTemplate.delete(key);
    }

    public List<BlindBox> getRecommendations(Long userId) {
        List<BlindBox> history = getBrowseHistory(userId);
        if (history.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> seriesSet = history.stream()
                .map(BlindBox::getSeriesName)
                .collect(Collectors.toSet());
        Set<Long> viewedIds = history.stream()
                .map(BlindBox::getId)
                .collect(Collectors.toSet());
        
        List<BlindBox> allBoxes = new ArrayList<>();
        for (String series : seriesSet) {
            Page<BlindBox> page = blindBoxRepository.searchAvailableBoxes(
                    series, null, userId, org.springframework.data.domain.PageRequest.of(0, 20));
            allBoxes.addAll(page.getContent());
        }
        return allBoxes.stream()
                .filter(box -> !viewedIds.contains(box.getId()))
                .limit(10)
                .collect(Collectors.toList());
    }
}
