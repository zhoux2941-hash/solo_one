package com.blindbox.exchange.controller;

import com.blindbox.exchange.dto.ApiResponse;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.Message;
import com.blindbox.exchange.security.JwtTokenProvider;
import com.blindbox.exchange.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getCurrentUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(token.substring(7));
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Message>>> getMyMessages(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<Message> messages = messageService.getUserMessages(userId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResponse<Message>>> getMyMessagesPaginated(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(token);
        PageResponse<Message> messages = messageService.getUserMessagesPaginated(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        long count = messageService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<Message>>> getUnreadMessages(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        List<Message> messages = messageService.getUnreadMessages(userId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<Message>> markAsRead(
            @RequestHeader("Authorization") String token,
            @PathVariable Long messageId) {
        Long userId = getCurrentUserId(token);
        Message message = messageService.markAsRead(userId, messageId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestHeader("Authorization") String token) {
        Long userId = getCurrentUserId(token);
        messageService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("已全部标记为已读", null));
    }
}
