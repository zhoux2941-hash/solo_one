package com.construction.progress.controller;

import com.construction.progress.dto.ApiResponse;
import com.construction.progress.dto.CommentDTO;
import com.construction.progress.security.JwtTokenProvider;
import com.construction.progress.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;
    private final JwtTokenProvider jwtTokenProvider;

    public CommentController(CommentService commentService, JwtTokenProvider jwtTokenProvider) {
        this.commentService = commentService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createComment(
            @AuthenticationPrincipal Long ownerId,
            @RequestHeader(value = "Authorization") String authorization,
            @Valid @RequestBody CommentDTO commentDTO) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            if (!"OWNER".equals(role)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只有房主可以留言"));
            }
            
            Map<String, Object> result = commentService.createComment(ownerId, commentDTO);
            String message = "URGE".equals(commentDTO.getType()) ? "催进度成功" : "留言成功";
            return ResponseEntity.ok(ApiResponse.success(message, result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProjectComments(@PathVariable Long projectId) {
        try {
            List<Map<String, Object>> comments = commentService.getProjectComments(projectId);
            return ResponseEntity.ok(ApiResponse.success(comments));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyComments(
            @AuthenticationPrincipal Long ownerId,
            @RequestHeader(value = "Authorization") String authorization) {
        try {
            String token = authorization.substring(7);
            String role = jwtTokenProvider.getRoleFromToken(token);
            
            if (!"OWNER".equals(role)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只有房主可以查看自己的留言"));
            }
            
            List<Map<String, Object>> comments = commentService.getOwnerComments(ownerId);
            return ResponseEntity.ok(ApiResponse.success(comments));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{commentId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long commentId) {
        try {
            commentService.markAsRead(commentId);
            return ResponseEntity.ok(ApiResponse.success("已标记为已读", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/project/{projectId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable Long projectId) {
        try {
            Long count = commentService.getUnreadCount(projectId);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
