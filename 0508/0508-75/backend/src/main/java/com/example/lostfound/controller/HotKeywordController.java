package com.example.lostfound.controller;

import com.example.lostfound.common.Result;
import com.example.lostfound.service.HotItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hot")
@RequiredArgsConstructor
public class HotKeywordController {

    private final HotItemService hotItemService;

    @GetMapping
    public Result<List<String>> getTopKeywords(
            @RequestParam(defaultValue = "10") int topN) {
        return Result.success(hotItemService.getTopKeywords(topN));
    }
}
