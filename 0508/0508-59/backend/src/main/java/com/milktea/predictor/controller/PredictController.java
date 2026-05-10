package com.milktea.predictor.controller;

import com.milktea.predictor.common.Result;
import com.milktea.predictor.dto.FeedbackRequest;
import com.milktea.predictor.dto.PredictRequest;
import com.milktea.predictor.dto.PredictResponse;
import com.milktea.predictor.entity.ComboWeight;
import com.milktea.predictor.entity.RatingFeedback;
import com.milktea.predictor.entity.RatingRecord;
import com.milktea.predictor.entity.TeaBase;
import com.milktea.predictor.entity.Topping;
import com.milktea.predictor.service.PredictService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PredictController {
    
    private final PredictService predictService;
    
    @PostMapping("/predict")
    public Result<PredictResponse> predict(@Validated @RequestBody PredictRequest request) {
        PredictResponse response = predictService.predict(request);
        return Result.success(response);
    }
    
    @GetMapping("/tea-bases")
    public Result<List<TeaBase>> getTeaBases() {
        return Result.success(predictService.getAllTeaBases());
    }
    
    @GetMapping("/toppings")
    public Result<List<Topping>> getToppings() {
        return Result.success(predictService.getAllToppings());
    }
    
    @GetMapping("/records")
    public Result<List<RatingRecord>> getRecentRecords(@RequestParam(defaultValue = "10") int limit) {
        return Result.success(predictService.getRecentRecords(limit));
    }
    
    @PostMapping("/feedback")
    public Result<RatingFeedback> submitFeedback(@Validated @RequestBody FeedbackRequest request) {
        RatingFeedback feedback = predictService.submitFeedback(request);
        return Result.success(feedback);
    }
    
    @GetMapping("/learned-combos")
    public Result<List<ComboWeight>> getTopLearnedCombos(@RequestParam(defaultValue = "10") int limit) {
        return Result.success(predictService.getTopLearnedCombos(limit));
    }
}
