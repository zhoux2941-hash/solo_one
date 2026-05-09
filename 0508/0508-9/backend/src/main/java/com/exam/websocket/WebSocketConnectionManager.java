package com.exam.websocket;

import com.exam.config.ExamProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class WebSocketConnectionManager {
    
    private final ExamProperties examProperties;
    
    private final AtomicInteger totalConnections = new AtomicInteger(0);
    private final Map<Long, AtomicInteger> examConnections = new ConcurrentHashMap<>();
    private final Set<String> activeSessions = ConcurrentHashMap.newKeySet();
    
    public WebSocketConnectionManager(ExamProperties examProperties) {
        this.examProperties = examProperties;
    }
    
    public boolean canJoinExam(Long examId) {
        int maxPerExam = examProperties.getWebsocket().getMaxConnectionsPerExam();
        int maxTotal = examProperties.getWebsocket().getMaxTotalConnections();
        
        AtomicInteger examCount = examConnections.get(examId);
        int currentExamCount = examCount != null ? examCount.get() : 0;
        int currentTotal = totalConnections.get();
        
        if (currentTotal >= maxTotal) {
            log.warn("Total connections exceeded: current={}, max={}", currentTotal, maxTotal);
            return false;
        }
        
        if (currentExamCount >= maxPerExam) {
            log.warn("Exam {} connections exceeded: current={}, max={}", 
                    examId, currentExamCount, maxPerExam);
            return false;
        }
        
        return true;
    }
    
    public void incrementConnection(Long examId, String sessionId) {
        if (!activeSessions.add(sessionId)) {
            return;
        }
        
        totalConnections.incrementAndGet();
        examConnections.computeIfAbsent(examId, k -> new AtomicInteger(0))
                      .incrementAndGet();
        
        log.debug("Connection incremented: examId={}, sessionId={}, total={}, examTotal={}", 
                examId, sessionId, 
                totalConnections.get(), 
                examConnections.get(examId).get());
    }
    
    public void decrementConnection(Long examId, String sessionId) {
        if (!activeSessions.remove(sessionId)) {
            return;
        }
        
        totalConnections.decrementAndGet();
        AtomicInteger examCount = examConnections.get(examId);
        if (examCount != null) {
            examCount.decrementAndGet();
        }
        
        log.debug("Connection decremented: examId={}, sessionId={}, total={}", 
                examId, sessionId, totalConnections.get());
    }
    
    public int getTotalConnections() {
        return totalConnections.get();
    }
    
    public int getExamConnections(Long examId) {
        AtomicInteger count = examConnections.get(examId);
        return count != null ? count.get() : 0;
    }
    
    public Map<Long, Integer> getAllExamConnections() {
        Map<Long, Integer> result = new ConcurrentHashMap<>();
        examConnections.forEach((key, value) -> result.put(key, value.get()));
        return result;
    }
    
    public String getLimitInfo(Long examId) {
        int maxPerExam = examProperties.getWebsocket().getMaxConnectionsPerExam();
        int maxTotal = examProperties.getWebsocket().getMaxTotalConnections();
        return String.format(
            "当前连接数: 考试%d=%d/%d, 总连接=%d/%d",
            examId, getExamConnections(examId), maxPerExam,
            getTotalConnections(), maxTotal
        );
    }
}
