package com.exam.service;

import com.exam.entity.CheatLog;
import com.exam.repository.CheatLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CheatPatternService {
    
    private final CheatLogRepository cheatLogRepository;
    private final AprioriService aprioriService;
    
    private static final double DEFAULT_MIN_SUPPORT = 0.1;
    private static final double DEFAULT_MIN_CONFIDENCE = 0.3;
    private static final int DEFAULT_MAX_GAP = 3;
    
    public CheatPatternService(CheatLogRepository cheatLogRepository,
                              AprioriService aprioriService) {
        this.cheatLogRepository = cheatLogRepository;
        this.aprioriService = aprioriService;
    }
    
    public Map<String, Object> analyzePatterns(Long examId) {
        log.info("Analyzing cheat patterns for exam: {}", examId);
        
        Map<String, Object> result = new HashMap<>();
        
        List<CheatLog> allLogs = cheatLogRepository.findAll();
        
        List<List<String>> transactions = buildTransactions(allLogs, examId);
        List<List<String>> sequences = buildSequences(allLogs, examId);
        
        log.info("Built {} transactions and {} sequences for pattern analysis", 
                transactions.size(), sequences.size());
        
        if (transactions.isEmpty()) {
            result.put("message", "暂无足够的作弊数据进行模式分析");
            result.put("transactions", 0);
            result.put("associationRules", new ArrayList<>());
            result.put("sequencePatterns", new ArrayList<>());
            result.put("graphData", buildEmptyGraphData());
            return result;
        }
        
        List<Map<String, Object>> associationRules = aprioriService.findFrequentPatterns(
                transactions, DEFAULT_MIN_SUPPORT, DEFAULT_MIN_CONFIDENCE);
        
        List<Map<String, Object>> sequencePatterns = aprioriService.generateSequencePatterns(
                sequences, DEFAULT_MAX_GAP, DEFAULT_MIN_SUPPORT / 2);
        
        List<Map<String, Object>> highConfidenceRules = associationRules.stream()
                .filter(rule -> (double) rule.get("confidence") >= 0.5)
                .limit(20)
                .collect(Collectors.toList());
        
        List<Map<String, Object>> topSequencePatterns = sequencePatterns.stream()
                .limit(30)
                .collect(Collectors.toList());
        
        Map<String, Object> graphData = buildGraphData(topSequencePatterns);
        
        Map<String, Object> summary = buildSummary(allLogs, examId, transactions, sequences);
        
        result.put("examId", examId);
        result.put("summary", summary);
        result.put("associationRules", highConfidenceRules);
        result.put("sequencePatterns", topSequencePatterns);
        result.put("graphData", graphData);
        result.put("parameters", Map.of(
                "minSupport", DEFAULT_MIN_SUPPORT,
                "minConfidence", DEFAULT_MIN_CONFIDENCE,
                "maxGap", DEFAULT_MAX_GAP
        ));
        
        log.info("Pattern analysis complete: {} association rules, {} sequence patterns", 
                highConfidenceRules.size(), topSequencePatterns.size());
        
        return result;
    }
    
    private List<List<String>> buildTransactions(List<CheatLog> allLogs, Long examId) {
        Map<String, List<String>> userExamActions = new HashMap<>();
        
        for (CheatLog log : allLogs) {
            if (examId != null && !examId.equals(log.getExamId())) {
                continue;
            }
            
            String key = log.getUserId() + "_" + log.getExamId();
            userExamActions.computeIfAbsent(key, k -> new ArrayList<>())
                          .add(log.getActionType());
        }
        
        return new ArrayList<>(userExamActions.values());
    }
    
    private List<List<String>> buildSequences(List<CheatLog> allLogs, Long examId) {
        Map<String, List<CheatLog>> userExamLogs = new HashMap<>();
        
        for (CheatLog log : allLogs) {
            if (examId != null && !examId.equals(log.getExamId())) {
                continue;
            }
            
            String key = log.getUserId() + "_" + log.getExamId();
            userExamLogs.computeIfAbsent(key, k -> new ArrayList<>())
                       .add(log);
        }
        
        List<List<String>> sequences = new ArrayList<>();
        
        for (List<CheatLog> logs : userExamLogs.values()) {
            logs.sort(Comparator.comparing(CheatLog::getTimestamp));
            
            List<String> sequence = new ArrayList<>();
            for (CheatLog log : logs) {
                sequence.add(log.getActionType());
            }
            
            if (sequence.size() >= 2) {
                sequences.add(sequence);
            }
        }
        
        return sequences;
    }
    
    private Map<String, Object> buildGraphData(List<Map<String, Object>> sequencePatterns) {
        if (sequencePatterns.isEmpty()) {
            return buildEmptyGraphData();
        }
        
        Set<String> allNodes = new HashSet<>();
        Map<String, Integer> nodeCounts = new HashMap<>();
        
        for (Map<String, Object> pattern : sequencePatterns) {
            String from = (String) pattern.get("from");
            String to = (String) pattern.get("to");
            
            allNodes.add(from);
            allNodes.add(to);
            
            nodeCounts.merge(from, (Integer) pattern.get("count"), Integer::sum);
            nodeCounts.merge(to, (Integer) pattern.get("count"), Integer::sum);
        }
        
        List<Map<String, Object>> nodes = new ArrayList<>();
        int maxCount = nodeCounts.values().stream().max(Integer::compare).orElse(1);
        
        Map<String, String> nodeColors = Map.of(
                "VISIBILITY_CHANGE", "#FF6B6B",
                "MOUSE_LEAVE", "#4ECDC4",
                "COPY", "#45B7D1",
                "PASTE", "#96CEB4",
                "RIGHT_CLICK", "#FFEAA7",
                "KEYBOARD_SHORTCUT", "#DDA0DD"
        );
        
        for (String node : allNodes) {
            Map<String, Object> nodeData = new HashMap<>();
            nodeData.put("id", node);
            nodeData.put("name", aprioriService.getActionLabel(node));
            nodeData.put("symbolSize", calculateNodeSize(nodeCounts.get(node), maxCount));
            nodeData.put("itemStyle", Map.of("color", nodeColors.getOrDefault(node, "#999999")));
            nodeData.put("count", nodeCounts.get(node));
            nodes.add(nodeData);
        }
        
        List<Map<String, Object>> links = new ArrayList<>();
        double maxStrength = sequencePatterns.stream()
                .mapToDouble(p -> (double) p.get("strength"))
                .max().orElse(1.0);
        
        for (Map<String, Object> pattern : sequencePatterns) {
            Map<String, Object> link = new HashMap<>();
            link.put("source", pattern.get("from"));
            link.put("target", pattern.get("to"));
            link.put("value", pattern.get("confidence"));
            link.put("strength", pattern.get("strength"));
            
            double normalizedStrength = maxStrength > 0 ? 
                    (double) pattern.get("strength") / maxStrength : 0;
            int lineWidth = (int) Math.max(1, normalizedStrength * 5);
            
            link.put("lineStyle", Map.of(
                    "width", lineWidth,
                    "curveness", 0.2
            ));
            
            link.put("label", Map.of(
                    "show", true,
                    "formatter", String.format("%.0f%%", (double) pattern.get("confidence") * 100)
            ));
            
            links.add(link);
        }
        
        Map<String, Object> graphData = new HashMap<>();
        graphData.put("nodes", nodes);
        graphData.put("links", links);
        graphData.put("categories", buildCategories());
        
        return graphData;
    }
    
    private List<Map<String, Object>> buildCategories() {
        List<Map<String, Object>> categories = new ArrayList<>();
        
        Map<String, String>[] mappings = new Map[]{
                Map.of("type", "VISIBILITY_CHANGE", "name", "切出窗口", "color", "#FF6B6B"),
                Map.of("type", "MOUSE_LEAVE", "name", "鼠标离开", "color", "#4ECDC4"),
                Map.of("type", "COPY", "name", "复制", "color", "#45B7D1"),
                Map.of("type", "PASTE", "name", "粘贴", "color", "#96CEB4"),
                Map.of("type", "RIGHT_CLICK", "name", "右键菜单", "color", "#FFEAA7"),
                Map.of("type", "KEYBOARD_SHORTCUT", "name", "快捷键", "color", "#DDA0DD")
        };
        
        for (Map<String, String> mapping : mappings) {
            Map<String, Object> category = new HashMap<>();
            category.put("name", mapping.get("name"));
            category.put("type", mapping.get("type"));
            category.put("itemStyle", Map.of("color", mapping.get("color")));
            categories.add(category);
        }
        
        return categories;
    }
    
    private int calculateNodeSize(int count, int maxCount) {
        if (maxCount == 0) return 30;
        double ratio = (double) count / maxCount;
        return (int) (20 + ratio * 30);
    }
    
    private Map<String, Object> buildEmptyGraphData() {
        Map<String, Object> graphData = new HashMap<>();
        graphData.put("nodes", new ArrayList<>());
        graphData.put("links", new ArrayList<>());
        graphData.put("categories", new ArrayList<>());
        return graphData;
    }
    
    private Map<String, Object> buildSummary(List<CheatLog> allLogs, Long examId,
                                            List<List<String>> transactions,
                                            List<List<String>> sequences) {
        Map<String, Object> summary = new HashMap<>();
        
        List<CheatLog> relevantLogs = examId != null ? 
                allLogs.stream().filter(l -> examId.equals(l.getExamId())).collect(Collectors.toList()) :
                allLogs;
        
        Map<String, Long> typeCounts = relevantLogs.stream()
                .collect(Collectors.groupingBy(CheatLog::getActionType, Collectors.counting()));
        
        summary.put("totalCheatEvents", relevantLogs.size());
        summary.put("uniqueUsers", transactions.size());
        summary.put("sequencesAnalyzed", sequences.size());
        summary.put("typeDistribution", typeCounts);
        
        long multiActionUsers = transactions.stream().filter(t -> t.size() >= 2).count();
        summary.put("multiActionUsers", multiActionUsers);
        
        if (!relevantLogs.isEmpty()) {
            Optional<CheatLog> earliest = relevantLogs.stream()
                    .min(Comparator.comparing(CheatLog::getTimestamp));
            Optional<CheatLog> latest = relevantLogs.stream()
                    .max(Comparator.comparing(CheatLog::getTimestamp));
            
            earliest.ifPresent(log -> summary.put("earliestEvent", log.getTimestamp()));
            latest.ifPresent(log -> summary.put("latestEvent", log.getTimestamp()));
        }
        
        return summary;
    }
}
