package com.example.lostfound.controller;

import com.example.lostfound.common.Result;
import com.example.lostfound.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final MatchingService matchingService;

    @PostMapping("/match-now")
    public Result<Void> runMatchingNow() {
        matchingService.runDailyMatching();
        return Result.success();
    }
}
