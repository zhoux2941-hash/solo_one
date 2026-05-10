package com.meme.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.meme.common.Result;
import com.meme.dto.ReviewRequest;
import com.meme.entity.Meme;
import com.meme.service.MemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private MemeService memeService;

    @GetMapping("/memes/pending")
    public Result<Page<Meme>> getPendingMemes(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(memeService.getPendingMemes(page, size));
    }

    @PostMapping("/memes/{id}/review")
    public Result<Void> review(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request,
            HttpServletRequest servletRequest) {
        try {
            Long reviewerId = (Long) servletRequest.getAttribute("userId");
            memeService.review(id, request, reviewerId);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
