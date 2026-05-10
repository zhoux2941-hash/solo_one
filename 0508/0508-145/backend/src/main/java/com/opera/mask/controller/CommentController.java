package com.opera.mask.controller;

import com.opera.mask.common.Result;
import com.opera.mask.entity.Comment;
import com.opera.mask.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public Result<Comment> addComment(@RequestBody AddCommentRequest request) {
        Comment comment = commentService.addComment(
                request.getDesignId(),
                request.getUserId(),
                request.getUserName(),
                request.getContent(),
                request.getParentId()
        );
        return Result.success(comment);
    }

    @GetMapping("/design/{designId}")
    public Result<List<Comment>> getCommentsByDesignId(@PathVariable Long designId) {
        return Result.success(commentService.getCommentsByDesignId(designId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteComment(
            @PathVariable Long id,
            @RequestParam Long userId) {
        commentService.deleteComment(id, userId);
        return Result.success();
    }

    @lombok.Data
    public static class AddCommentRequest {
        private Long designId;
        private Long userId;
        private String userName;
        private String content;
        private Long parentId;
    }
}
