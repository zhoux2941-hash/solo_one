package com.driving.controller;

import com.driving.common.Result;
import com.driving.dto.RatingDTO;
import com.driving.entity.Coach;
import com.driving.service.CoachService;
import com.driving.service.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private CoachService coachService;

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/student/rating")
    public Result<Void> submitRating(@RequestBody @Validated RatingDTO ratingDTO) {
        Long studentId = getCurrentUserId();
        ratingService.submitRating(studentId, ratingDTO);
        return Result.success("评分成功", null);
    }

    @GetMapping("/coach/{coachId}/ratings")
    public Result<List<Map<String, Object>>> getCoachRatings(@PathVariable Long coachId) {
        List<Map<String, Object>> ratings = ratingService.getCoachRatings(coachId);
        return Result.success(ratings);
    }

    @GetMapping("/coach/manage/ratings")
    public Result<List<Map<String, Object>>> getMyCoachRatings() {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }
        List<Map<String, Object>> ratings = ratingService.getCoachRatings(coach.getId());
        return Result.success(ratings);
    }
}