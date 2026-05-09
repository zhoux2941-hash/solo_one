package com.exam.websocket;

import com.alibaba.fastjson2.JSON;
import com.exam.config.ExamProperties;
import com.exam.dto.CheatLogDTO;
import com.exam.entity.CheatLog;
import com.exam.entity.User;
import com.exam.repository.UserRepository;
import com.exam.service.CheatBufferService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Controller
public class CheatWebSocketController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketConnectionManager connectionManager;
    private final CheatBufferService cheatBufferService;
    private final UserRepository userRepository;
    private final ExamProperties examProperties;
    
    public CheatWebSocketController(SimpMessagingTemplate messagingTemplate,
                                   WebSocketConnectionManager connectionManager,
                                   CheatBufferService cheatBufferService,
                                   UserRepository userRepository,
                                   ExamProperties examProperties) {
        this.messagingTemplate = messagingTemplate;
        this.connectionManager = connectionManager;
        this.cheatBufferService = cheatBufferService;
        this.userRepository = userRepository;
        this.examProperties = examProperties;
    }
    
    @MessageMapping("/cheat.report")
    @SendTo("/topic/exam/{examId}")
    public Map<String, Object> reportCheat(
            @DestinationVariable("examId") Long examId,
            @Payload CheatLogDTO cheatLogDTO,
            SimpMessageHeaderAccessor headerAccessor) {
        
        log.info("Received cheat report: userId={}, examId={}, actionType={}", 
                cheatLogDTO.getUserId(), examId, cheatLogDTO.getActionType());
        
        if (cheatLogDTO.getTimestamp() == null) {
            cheatLogDTO.setTimestamp(LocalDateTime.now());
        }
        
        String sessionId = headerAccessor.getSessionId();
        
        CheatLog cheatLog = convertToEntity(cheatLogDTO, examId);
        cheatBufferService.pushToBuffer(cheatLog);
        
        User user = userRepository.findById(cheatLogDTO.getUserId()).orElse(null);
        String userName = user != null ? 
                (user.getRealName() != null ? user.getRealName() : user.getUsername()) 
                : "User_" + cheatLogDTO.getUserId();
        
        Map<String, Object> result = new HashMap<>();
        result.put("type", "cheat");
        result.put("sessionId", sessionId);
        result.put("data", cheatLogDTO);
        result.put("userName", userName);
        result.put("timestamp", cheatLogDTO.getTimestamp());
        
        log.debug("Broadcasting cheat event to exam room: examId={}", examId);
        
        return result;
    }
    
    @SubscribeMapping("/topic/exam/{examId}")
    public Map<String, Object> subscribeToExam(
            @DestinationVariable("examId") Long examId,
            SimpMessageHeaderAccessor headerAccessor) {
        
        String sessionId = headerAccessor.getSessionId();
        
        log.info("Teacher subscribing to exam: examId={}, sessionId={}", examId, sessionId);
        
        if (!connectionManager.canJoinExam(examId)) {
            String errorMsg = "连接数已达上限！" + connectionManager.getLimitInfo(examId);
            log.warn("Connection rejected: {}", errorMsg);
            
            Map<String, Object> error = new HashMap<>();
            error.put("type", "error");
            error.put("code", "CONNECTION_LIMIT_EXCEEDED");
            error.put("message", errorMsg);
            error.put("maxConnections", examProperties.getWebsocket().getMaxConnectionsPerExam());
            error.put("currentConnections", connectionManager.getExamConnections(examId));
            
            messagingTemplate.convertAndSendToUser(
                    sessionId,
                    "/queue/errors",
                    error
            );
            
            return error;
        }
        
        connectionManager.incrementConnection(examId, sessionId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "subscribe_success");
        response.put("examId", examId);
        response.put("sessionId", sessionId);
        response.put("currentConnections", connectionManager.getExamConnections(examId));
        response.put("maxConnections", examProperties.getWebsocket().getMaxConnectionsPerExam());
        response.put("message", "订阅成功，开始监控考试作弊行为");
        
        log.info("Subscription success: examId={}, currentConnections={}", 
                examId, connectionManager.getExamConnections(examId));
        
        return response;
    }
    
    @MessageMapping("/student.join")
    public Map<String, Object> studentJoin(
            @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Long examId = payload.get("examId") != null ? 
                Long.valueOf(payload.get("examId").toString()) : null;
        Long userId = payload.get("userId") != null ? 
                Long.valueOf(payload.get("userId").toString()) : null;
        String sessionId = headerAccessor.getSessionId();
        
        log.info("Student joining exam: examId={}, userId={}, sessionId={}", 
                examId, userId, sessionId);
        
        Map<String, Object> response = new HashMap<>();
        
        if (examId == null || userId == null) {
            response.put("type", "error");
            response.put("message", "缺少必要参数");
            return response;
        }
        
        if (!connectionManager.canJoinExam(examId)) {
            String errorMsg = "连接数已达上限！" + connectionManager.getLimitInfo(examId);
            log.warn("Student connection rejected: {}", errorMsg);
            
            response.put("type", "error");
            response.put("code", "CONNECTION_LIMIT_EXCEEDED");
            response.put("message", errorMsg);
            response.put("maxConnections", examProperties.getWebsocket().getMaxConnectionsPerExam());
            response.put("currentConnections", connectionManager.getExamConnections(examId));
            return response;
        }
        
        headerAccessor.getSessionAttributes().put("examId", examId);
        headerAccessor.getSessionAttributes().put("userId", userId);
        headerAccessor.getSessionAttributes().put("role", "STUDENT");
        
        connectionManager.incrementConnection(examId, sessionId);
        
        response.put("type", "join_success");
        response.put("examId", examId);
        response.put("userId", userId);
        response.put("sessionId", sessionId);
        response.put("message", "连接成功，作弊监控已启动");
        
        log.info("Student joined successfully: examId={}, userId={}, currentConnections={}", 
                examId, userId, connectionManager.getExamConnections(examId));
        
        return response;
    }
    
    @MessageMapping("/teacher.join")
    public Map<String, Object> teacherJoin(
            @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Long userId = payload.get("userId") != null ? 
                Long.valueOf(payload.get("userId").toString()) : null;
        String sessionId = headerAccessor.getSessionId();
        
        log.info("Teacher joining: userId={}, sessionId={}", userId, sessionId);
        
        headerAccessor.getSessionAttributes().put("userId", userId);
        headerAccessor.getSessionAttributes().put("role", "TEACHER");
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "join_success");
        response.put("role", "TEACHER");
        response.put("sessionId", sessionId);
        response.put("message", "教师连接成功，请订阅要监控的考试");
        
        return response;
    }
    
    private CheatLog convertToEntity(CheatLogDTO dto, Long examId) {
        CheatLog log = new CheatLog();
        log.setUserId(dto.getUserId());
        log.setExamId(examId);
        log.setQuestionId(dto.getQuestionId());
        log.setActionType(dto.getActionType());
        log.setActionDetail(dto.getActionDetail());
        log.setTimestamp(dto.getTimestamp());
        return log;
    }
}
