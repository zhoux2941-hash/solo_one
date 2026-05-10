package com.construction.progress.controller;

import com.construction.progress.dto.ApiResponse;
import com.construction.progress.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMessages(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false, defaultValue = "false") Boolean onlyUnread) {
        try {
            List<Map<String, Object>> messages = messageService.getUserMessages(userId, onlyUnread);
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal Long userId) {
        try {
            Long count = messageService.getUnreadCount(userId);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long messageId) {
        try {
            messageService.markAsRead(messageId);
            return ResponseEntity.ok(ApiResponse.success("已标记为已读", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal Long userId) {
        try {
            messageService.markAllAsRead(userId);
            return ResponseEntity.ok(ApiResponse.success("已全部标记为已读", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/warnings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWarningProjects() {
        try {
            List<Map<String, Object>> warnings = messageService.getWarningProjects();
            return ResponseEntity.ok(ApiResponse.success(warnings));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/check-now")
    public ResponseEntity<ApiResponse<String>> checkOverdueNow() {
        try {
            messageService.checkOverdueStages();
            return ResponseEntity.ok(ApiResponse.success("手动触发超时检查完成", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
