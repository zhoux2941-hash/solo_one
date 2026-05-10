package com.meme.controller;

import com.meme.common.Result;
import com.meme.dto.CommentRequest;
import com.meme.entity.Comment;
import com.meme.service.CommentService;
import com.meme.vo.CommentVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping
    public Result<Comment> addComment(@Valid @RequestBody CommentRequest request, HttpServletRequest servletRequest) {
        try {
            Long userId = (Long) servletRequest.getAttribute("userId");
            Comment comment = commentService.addComment(request, userId);
            return Result.success(comment);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/meme/{memeId}")
    public Result<List<CommentVO>> getComments(@PathVariable Long memeId) {
        return Result.success(commentService.getComments(memeId));
    }
}
