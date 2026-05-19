package com.music.controller;

import com.music.config.JwtUtil;
import com.music.dto.ApiResponse;
import com.music.dto.CommentDTO;
import com.music.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentDTO>> createComment(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long musicId,
            @RequestParam String content,
            @RequestParam(required = false) Long parentId) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<CommentDTO> response = commentService.createComment(userId, musicId, content, parentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/music/{musicId}")
    public ResponseEntity<ApiResponse<List<CommentDTO>>> getMusicComments(@PathVariable Long musicId) {
        ApiResponse<List<CommentDTO>> response = commentService.getMusicComments(musicId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteComment(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        String token = authHeader.substring(7);
        Long userId = jwtUtil.extractUserId(token);
        ApiResponse<String> response = commentService.deleteComment(userId, id);
        return ResponseEntity.ok(response);
    }
}
