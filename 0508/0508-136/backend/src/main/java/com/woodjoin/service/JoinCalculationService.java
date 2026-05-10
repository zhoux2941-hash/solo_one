package com.woodjoin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.woodjoin.dto.JoinParamsDTO;
import com.woodjoin.enums.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class JoinCalculationService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public Map<String, Object> calculateJoin(JoinParamsDTO params) {
        String cacheKey = generateCacheKey(params);
        String cached = redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            log.debug("从缓存获取榫卯计算结果");
            try {
                return objectMapper.readValue(cached, Map.class);
            } catch (Exception e) {
                log.warn("缓存解析失败，重新计算", e);
            }
        }

        Map<String, Object> result = switch (params.getJoinType()) {
            case DOVETAIL -> calculateDovetail(params);
            case STRAIGHT -> calculateStraight(params);
            case CLAMP -> calculateClamp(params);
            case BOX -> calculateBox(params);
            case LAP -> calculateLap(params);
        };

        result.put("joinType", params.getJoinType().name());
        result.put("joinTypeName", params.getJoinType().getDisplayName());
        result.put("originalParams", params);

        try {
            String json = objectMapper.writeValueAsString(result);
            redisTemplate.opsForValue().set(cacheKey, json, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("缓存保存失败", e);
        }

        return result;
    }

    private Map<String, Object> calculateDovetail(JoinParamsDTO params) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double tailWidth = params.getTenonWidth();
        double tailHeight = params.getTenonHeight();
        double tailLength = params.getTenonLength();
        double woodWidth = params.getWoodWidth();
        double margin = params.getMargin();
        
        double minTailAngleDeg = 70;
        double maxTailAngleDeg = 85;
        
        double maxSafeAngleDeg = 90 - Math.toDegrees(Math.atan((tailWidth / 2) / tailHeight));
        double safeAngleDeg = Math.min(maxSafeAngleDeg - 2, maxTailAngleDeg);
        safeAngleDeg = Math.max(safeAngleDeg, minTailAngleDeg);
        
        int tailCount = Math.max(1, (int) ((woodWidth - 2 * margin) / (tailWidth * 1.8)));
        
        double availableSpace = woodWidth - 2 * margin;
        double angleRad = Math.toRadians(safeAngleDeg);
        double maxOffset = tailHeight * Math.tan(Math.PI / 2 - angleRad);
        
        double tailTopWidth = availableSpace / (tailCount * 2);
        double tailBottomWidth = tailTopWidth + 2 * maxOffset;
        double minGap = tailBottomWidth * 0.8;
        
        while (tailCount > 1 && (tailTopWidth * tailCount + minGap * tailCount) > availableSpace) {
            tailCount--;
            tailTopWidth = availableSpace / (tailCount * 2);
            tailBottomWidth = tailTopWidth + 2 * maxOffset;
        }
        
        if (tailCount == 1) {
            double totalRequired = tailBottomWidth + minGap;
            if (totalRequired > availableSpace) {
                double scale = availableSpace / totalRequired;
                tailTopWidth *= scale * 0.6;
                maxOffset = (availableSpace * 0.2) / 2;
                safeAngleDeg = 90 - Math.toDegrees(Math.atan(maxOffset / tailHeight));
                safeAngleDeg = Math.max(safeAngleDeg, minTailAngleDeg);
                angleRad = Math.toRadians(safeAngleDeg);
            }
        }
        
        double gapSize = tailTopWidth;
        double actualOffset = tailHeight * Math.tan(Math.PI / 2 - angleRad);
        
        result.put("tailCount", tailCount);
        result.put("tailWidth", tailTopWidth);
        result.put("tailBottomWidth", tailTopWidth + 2 * actualOffset);
        result.put("tailHeight", tailHeight);
        result.put("tailLength", tailLength);
        result.put("tailAngle", safeAngleDeg);
        result.put("tailOffset", actualOffset);
        result.put("gapSize", gapSize);
        result.put("margin", margin);
        result.put("woodWidth", woodWidth);
        
        List<Map<String, Double>> tails = new ArrayList<>();
        for (int i = 0; i < tailCount; i++) {
            Map<String, Double> tail = new LinkedHashMap<>();
            double x = margin + gapSize + i * (tailTopWidth + gapSize);
            tail.put("x", x);
            tail.put("y", 0.0);
            tail.put("z", 0.0);
            tail.put("width", tailTopWidth);
            tail.put("bottomWidth", tailTopWidth + 2 * actualOffset);
            tail.put("height", tailHeight);
            tail.put("length", tailLength);
            tail.put("offset", actualOffset);
            tails.add(tail);
        }
        result.put("tails", tails);
        
        return result;
    }

    private Map<String, Object> calculateStraight(JoinParamsDTO params) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double tenonLength = params.getTenonLength();
        double tenonWidth = params.getTenonWidth();
        double tenonHeight = params.getTenonHeight();
        double margin = params.getMargin();
        double woodWidth = params.getWoodWidth();
        double woodHeight = params.getWoodHeight();
        
        double mortiseWidth = tenonWidth;
        double mortiseHeight = tenonHeight;
        double mortiseDepth = tenonLength;
        
        double tenonX = (woodWidth - tenonWidth) / 2;
        double tenonY = margin;
        double tenonZ = margin;
        
        result.put("tenon", Map.of(
            "x", tenonX,
            "y", tenonY,
            "z", tenonZ,
            "length", tenonLength,
            "width", tenonWidth,
            "height", tenonHeight
        ));
        
        result.put("mortise", Map.of(
            "x", tenonX,
            "y", tenonY,
            "z", tenonZ,
            "length", mortiseDepth,
            "width", mortiseWidth,
            "height", mortiseHeight
        ));
        
        result.put("fit", "紧密配合");
        result.put("margin", margin);
        
        return result;
    }

    private Map<String, Object> calculateClamp(JoinParamsDTO params) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double tenonLength = params.getTenonLength();
        double tenonWidth = params.getTenonWidth();
        double tenonHeight = params.getTenonHeight();
        double woodWidth = params.getWoodWidth();
        double woodHeight = params.getWoodHeight();
        double margin = params.getMargin();
        
        double shoulderWidth = tenonWidth * 1.2;
        double shoulderHeight = tenonHeight * 0.3;
        double clampDepth = tenonLength * 0.4;
        
        result.put("tenon", Map.of(
            "x", (woodWidth - tenonWidth) / 2,
            "y", margin,
            "z", margin,
            "length", tenonLength,
            "width", tenonWidth,
            "height", tenonHeight
        ));
        
        result.put("shoulder", Map.of(
            "width", shoulderWidth,
            "height", shoulderHeight,
            "clampDepth", clampDepth
        ));
        
        result.put("margin", margin);
        result.put("fit", "夹头配合");
        
        return result;
    }

    private Map<String, Object> calculateBox(JoinParamsDTO params) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double woodWidth = params.getWoodWidth();
        double margin = params.getMargin();
        double tenonWidth = params.getTenonWidth();
        double tenonHeight = params.getTenonHeight();
        
        int fingerCount = Math.max(2, (int) ((woodWidth - 2 * margin) / tenonWidth));
        double actualFingerWidth = (woodWidth - 2 * margin) / (fingerCount);
        
        result.put("fingerCount", fingerCount);
        result.put("fingerWidth", actualFingerWidth);
        result.put("fingerHeight", tenonHeight);
        result.put("margin", margin);
        
        List<Map<String, Double>> fingers = new ArrayList<>();
        for (int i = 0; i < fingerCount; i++) {
            Map<String, Double> finger = new LinkedHashMap<>();
            finger.put("index", (double) i);
            finger.put("x", margin + i * actualFingerWidth);
            finger.put("y", 0.0);
            finger.put("z", 0.0);
            finger.put("width", actualFingerWidth);
            finger.put("height", tenonHeight);
            finger.put("length", params.getTenonLength());
            fingers.add(finger);
        }
        result.put("fingers", fingers);
        
        return result;
    }

    private Map<String, Object> calculateLap(JoinParamsDTO params) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double woodWidth = params.getWoodWidth();
        double woodHeight = params.getWoodHeight();
        double tenonLength = params.getTenonLength();
        double margin = params.getMargin();
        
        double lapWidth = woodWidth - 2 * margin;
        double lapHeight = woodHeight / 2;
        
        result.put("lap", Map.of(
            "x", margin,
            "y", margin,
            "z", woodHeight / 2,
            "length", tenonLength,
            "width", lapWidth,
            "height", lapHeight
        ));
        
        result.put("notch", Map.of(
            "x", margin,
            "y", margin,
            "z", 0.0,
            "length", tenonLength,
            "width", lapWidth,
            "height", lapHeight
        ));
        
        result.put("margin", margin);
        
        return result;
    }

    private String generateCacheKey(JoinParamsDTO params) {
        return String.format("join:%s:%.2f:%.2f:%.2f:%.2f:%.2f:%.2f:%.2f",
                params.getJoinType(),
                params.getWoodLength(),
                params.getWoodWidth(),
                params.getWoodHeight(),
                params.getTenonLength(),
                params.getTenonWidth(),
                params.getTenonHeight(),
                params.getMargin());
    }
}