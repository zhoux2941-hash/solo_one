package com.meme.controller;

import com.meme.common.Result;
import com.meme.service.VoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/votes")
@CrossOrigin
public class VoteController {

    @Autowired
    private VoteService voteService;

    @PostMapping("/{memeId}")
    public Result<Void> vote(@PathVariable Long memeId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            voteService.vote(userId, memeId);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/remaining")
    public Result<Map<String, Object>> getRemainingVotes(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Integer remaining = voteService.getRemainingVotes(userId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("remaining", remaining);
        result.put("dailyLimit", 10);
        
        return Result.success(result);
    }

    @GetMapping("/count/{memeId}")
    public Result<Long> getVoteCount(@PathVariable Long memeId) {
        return Result.success(voteService.getVoteCount(memeId));
    }
}
