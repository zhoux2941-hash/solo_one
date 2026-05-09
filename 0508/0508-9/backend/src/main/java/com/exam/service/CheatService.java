package com.exam.service;

import com.exam.dto.CheatLogDTO;
import com.exam.entity.CheatLog;
import com.exam.entity.Question;
import com.exam.entity.User;
import com.exam.repository.CheatLogRepository;
import com.exam.repository.QuestionRepository;
import com.exam.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class CheatService {
    
    private final CheatLogRepository cheatLogRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final CheatBufferService cheatBufferService;
    
    private static final Map<String, Integer> ACTION_WEIGHTS = new HashMap<>();
    
    static {
        ACTION_WEIGHTS.put("VISIBILITY_CHANGE", 3);
        ACTION_WEIGHTS.put("MOUSE_LEAVE", 2);
        ACTION_WEIGHTS.put("COPY", 5);
        ACTION_WEIGHTS.put("PASTE", 5);
        ACTION_WEIGHTS.put("RIGHT_CLICK", 4);
        ACTION_WEIGHTS.put("KEYBOARD_SHORTCUT", 3);
    }
    
    public CheatService(CheatLogRepository cheatLogRepository,
                        UserRepository userRepository,
                        QuestionRepository questionRepository,
                        StringRedisTemplate stringRedisTemplate,
                        CheatBufferService cheatBufferService) {
        this.cheatLogRepository = cheatLogRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.stringRedisTemplate = stringRedisTemplate;
        this.cheatBufferService = cheatBufferService;
    }
    
    public CheatLogDTO saveCheatLog(CheatLogDTO dto) {
        if (dto.getTimestamp() == null) {
            dto.setTimestamp(LocalDateTime.now());
        }
        
        CheatLog cheatLog = convertToEntity(dto);
        cheatBufferService.pushToBuffer(cheatLog);
        
        log.info("Cheat log pushed to buffer: userId={}, examId={}, actionType={}", 
                dto.getUserId(), dto.getExamId(), dto.getActionType());
        
        return dto;
    }
    
    private CheatLog convertToEntity(CheatLogDTO dto) {
        CheatLog log = new CheatLog();
        log.setUserId(dto.getUserId());
        log.setExamId(dto.getExamId());
        log.setQuestionId(dto.getQuestionId());
        log.setActionType(dto.getActionType());
        log.setActionDetail(dto.getActionDetail());
        log.setTimestamp(dto.getTimestamp());
        return log;
    }
    
    private CheatLogDTO convertToDTO(CheatLog log) {
        CheatLogDTO dto = new CheatLogDTO();
        dto.setId(log.getId());
        dto.setUserId(log.getUserId());
        dto.setExamId(log.getExamId());
        dto.setQuestionId(log.getQuestionId());
        dto.setActionType(log.getActionType());
        dto.setActionDetail(log.getActionDetail());
        dto.setTimestamp(log.getTimestamp());
        
        userRepository.findById(log.getUserId()).ifPresent(user -> {
            dto.setUserName(user.getRealName() != null ? user.getRealName() : user.getUsername());
        });
        
        return dto;
    }
    
    public Map<String, Object> getCheatStatistics(Long examId) {
        Map<String, Object> result = new HashMap<>();
        
        List<CheatLog> logs = cheatLogRepository.findByExamId(examId);
        result.put("totalEvents", logs.size());
        
        Set<Long> userIds = new HashSet<>();
        Map<String, Integer> typeCounts = new HashMap<>();
        
        for (CheatLog log : logs) {
            userIds.add(log.getUserId());
            typeCounts.merge(log.getActionType(), 1, Integer::sum);
        }
        
        result.put("affectedUsers", userIds.size());
        result.put("typeBreakdown", typeCounts);
        
        return result;
    }
    
    public Map<String, Object> getHeatMapData(Long examId, Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        List<Question> questions = questionRepository.findByExamIdOrderByQuestionOrder(examId);
        Map<Long, Integer> questionIndexMap = new HashMap<>();
        for (int i = 0; i < questions.size(); i++) {
            questionIndexMap.put(questions.get(i).getId(), i);
        }
        
        List<String> xAxis = new ArrayList<>();
        for (int i = 1; i <= questions.size(); i++) {
            xAxis.add("第" + i + "题");
        }
        
        List<String> yAxis = Arrays.asList("切出窗口", "鼠标离开", "复制", "粘贴", "右键菜单", "快捷键");
        Map<String, Integer> actionTypeIndexMap = new HashMap<>();
        actionTypeIndexMap.put("VISIBILITY_CHANGE", 0);
        actionTypeIndexMap.put("MOUSE_LEAVE", 1);
        actionTypeIndexMap.put("COPY", 2);
        actionTypeIndexMap.put("PASTE", 3);
        actionTypeIndexMap.put("RIGHT_CLICK", 4);
        actionTypeIndexMap.put("KEYBOARD_SHORTCUT", 5);
        
        List<List<Integer>> data = new ArrayList<>();
        for (int i = 0; i < yAxis.size(); i++) {
            for (int j = 0; j < xAxis.size(); j++) {
                List<Integer> point = new ArrayList<>();
                point.add(j);
                point.add(i);
                point.add(0);
                data.add(point);
            }
        }
        
        List<Object[]> heatmapData = cheatLogRepository.getHeatMapDataByExamAndUser(examId, userId);
        for (Object[] row : heatmapData) {
            Long questionId = (Long) row[0];
            String actionType = (String) row[1];
            Long count = (Long) row[2];
            
            Integer qIndex = questionIndexMap.get(questionId);
            Integer aIndex = actionTypeIndexMap.get(actionType);
            
            if (qIndex != null && aIndex != null) {
                int idx = aIndex * xAxis.size() + qIndex;
                if (idx < data.size()) {
                    data.get(idx).set(2, count.intValue());
                }
            }
        }
        
        result.put("xAxis", xAxis);
        result.put("yAxis", yAxis);
        result.put("data", data);
        
        return result;
    }
    
    public List<Map<String, Object>> getTrendData(Long examId) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        List<Object[]> trendData = cheatLogRepository.getTrendDataByExam(examId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        for (Object[] row : trendData) {
            Map<String, Object> item = new HashMap<>();
            item.put("time", row[0]);
            item.put("count", row[1]);
            result.add(item);
        }
        
        return result;
    }
    
    public List<Map<String, Object>> getHighRiskStudents(Long examId) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        List<Object[]> topCheaters = cheatLogRepository.getTopCheatersByExam(examId);
        
        for (Object[] row : topCheaters) {
            Long userId = (Long) row[0];
            Long totalCount = (Long) row[1];
            
            Map<String, Object> studentData = new HashMap<>();
            
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                studentData.put("userId", userId);
                studentData.put("userName", user.getRealName() != null ? user.getRealName() : user.getUsername());
            } else {
                studentData.put("userId", userId);
                studentData.put("userName", "User_" + userId);
            }
            
            studentData.put("totalCount", totalCount);
            
            int weightedScore = 0;
            List<Object[]> typeCounts = cheatLogRepository.getCheatTypeCountByExamAndUser(examId, userId);
            Map<String, Long> typeCountMap = new HashMap<>();
            
            for (Object[] typeRow : typeCounts) {
                String type = (String) typeRow[0];
                Long count = (Long) typeRow[1];
                typeCountMap.put(type, count);
                
                Integer weight = ACTION_WEIGHTS.getOrDefault(type, 1);
                weightedScore += count.intValue() * weight;
            }
            
            studentData.put("typeCounts", typeCountMap);
            studentData.put("riskScore", weightedScore);
            
            result.add(studentData);
        }
        
        result.sort((a, b) -> ((Integer) b.get("riskScore")).compareTo((Integer) a.get("riskScore")));
        
        return result;
    }
    
    public List<CheatLogDTO> getRealTimeCheatLogs(Long examId) {
        List<CheatLog> logs = cheatLogRepository.findByExamIdOrderByTimestampDesc(examId);
        List<CheatLogDTO> result = new ArrayList<>();
        
        List<Question> questions = questionRepository.findByExamId(examId);
        Map<Long, Integer> questionNumberMap = new HashMap<>();
        for (Question q : questions) {
            questionNumberMap.put(q.getId(), q.getQuestionOrder());
        }
        
        for (CheatLog log : logs) {
            CheatLogDTO dto = convertToDTO(log);
            Integer qNum = questionNumberMap.get(log.getQuestionId());
            if (qNum != null) {
                dto.setQuestionNumber("第" + qNum + "题");
            }
            result.add(dto);
        }
        
        return result;
    }
    
    public Long getCheatCountFromRedis(Long examId, Long userId) {
        String key = String.format("cheat:exam:%d:user:%d", examId, userId);
        String value = stringRedisTemplate.opsForValue().get(key);
        return value != null ? Long.parseLong(value) : 0L;
    }
}