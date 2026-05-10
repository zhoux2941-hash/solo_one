package com.milktea.predictor.service;

import com.milktea.predictor.dto.FeedbackRequest;
import com.milktea.predictor.dto.PredictRequest;
import com.milktea.predictor.dto.PredictResponse;
import com.milktea.predictor.entity.ComboWeight;
import com.milktea.predictor.entity.RatingFeedback;
import com.milktea.predictor.entity.RatingRecord;
import com.milktea.predictor.entity.TeaBase;
import com.milktea.predictor.entity.Topping;

import java.util.List;

public interface PredictService {
    PredictResponse predict(PredictRequest request);
    
    List<TeaBase> getAllTeaBases();
    
    List<Topping> getAllToppings();
    
    List<RatingRecord> getRecentRecords(int limit);
    
    RatingFeedback submitFeedback(FeedbackRequest request);
    
    List<ComboWeight> getTopLearnedCombos(int limit);
}
